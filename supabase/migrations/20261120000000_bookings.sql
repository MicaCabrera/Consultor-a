-- Reservas de consultorías — esquema, reglas y seguridad.
--
-- Turnos: lunes a viernes, 09:00 y 10:30 (hora de Buenos Aires). No hay tabla
-- de turnos disponibles: la disponibilidad se calcula a partir de esta regla y
-- se compara con lo ya reservado.
--
-- El público nunca lee ni escribe las tablas directamente:
--   · get_taken_slots()  devuelve solo los turnos ocupados (sin datos personales)
--   · create_booking()   valida las reglas e inserta la reserva como 'pending'
-- La administración usa RLS: solo usuarios con profiles.is_admin = true.

-- ─── Tipos ───────────────────────────────────────────────────────────────────

create type public.booking_status as enum ('pending', 'confirmed', 'cancelled');

-- ─── Reservas ────────────────────────────────────────────────────────────────

create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  date             date not null,
  slot             text not null check (slot in ('09:00', '10:30')),
  status           public.booking_status not null default 'pending',
  name             text not null check (char_length(name) between 2 and 120),
  email            text not null check (
                     char_length(email) <= 254
                     and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
                   ),
  occupation       text not null check (char_length(occupation) between 2 and 300),
  topic            text not null check (char_length(topic) between 10 and 2000),
  -- Enlace de la videollamada; se carga al confirmar y va en los emails.
  meeting_url      text check (meeting_url is null or meeting_url ~* '^https?://\S+$'),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  confirmed_at     timestamptz,
  cancelled_at     timestamptz,
  -- Lo marca el cron al enviar el recordatorio, para no enviarlo dos veces.
  reminder_sent_at timestamptz,
  constraint bookings_weekday check (extract(isodow from date) between 1 and 5)
);

-- Un solo turno activo por fecha y horario. Lo garantiza Postgres, incluso si
-- dos reservas llegan casi a la vez; las canceladas no ocupan el turno.
create unique index bookings_active_slot_key
  on public.bookings (date, slot)
  where status <> 'cancelled';

create index bookings_status_date_idx on public.bookings (status, date);

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_touch_updated_at
  before update on public.bookings
  for each row execute function public.touch_updated_at();

-- ─── Días bloqueados (vacaciones, feriados) ──────────────────────────────────

create table public.blocked_days (
  date       date primary key,
  reason     text check (reason is null or char_length(reason) <= 200),
  created_at timestamptz not null default now()
);

-- ─── Perfiles y rol de administrador ─────────────────────────────────────────

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Cada usuario de Auth tiene su perfil (sin permisos por defecto).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.bookings     enable row level security;
alter table public.blocked_days enable row level security;
alter table public.profiles     enable row level security;

-- Reservas: solo administradores las leen y las modifican. Nadie las inserta
-- ni borra directamente (el alta pasa por create_booking).
create policy "admins read bookings"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

create policy "admins update bookings"
  on public.bookings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Días bloqueados: administración completa solo para administradores.
create policy "admins manage blocked days"
  on public.blocked_days for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Perfiles: cada usuario ve solo el suyo; el flag is_admin no se edita desde
-- la app (se asigna con SQL desde el panel de Supabase).
create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- ─── Reglas de negocio ───────────────────────────────────────────────────────

-- Una reserva pendiente sin pago verificado deja de ocupar el turno a las 24 h.
create function public.pending_ttl()
returns interval
language sql
immutable
as $$ select interval '24 hours' $$;

-- Turnos ocupados entre dos fechas: confirmados, pendientes vigentes y días
-- bloqueados (ambos horarios). Sin datos personales.
create function public.get_taken_slots(p_from date, p_to date)
returns table (date date, slot text)
language sql
stable
security definer
set search_path = ''
as $$
  select b.date, b.slot
  from public.bookings b
  where b.date between p_from and least(p_to, p_from + 62)
    and (
      b.status = 'confirmed'
      or (b.status = 'pending' and b.created_at > now() - public.pending_ttl())
    )
  union
  select d.date, s.slot
  from public.blocked_days d
  cross join (values ('09:00'), ('10:30')) as s (slot)
  where d.date between p_from and least(p_to, p_from + 62);
$$;

-- Alta de una reserva como 'pending'. Valida día hábil, horario, ventana de
-- reserva (desde mañana hasta 5 semanas) y días bloqueados. Si el turno ya está
-- tomado, el índice único rechaza el insert (SQLSTATE 23505).
create function public.create_booking(
  p_date       date,
  p_slot       text,
  p_name       text,
  p_email      text,
  p_occupation text,
  p_topic      text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_id    uuid;
begin
  if p_slot not in ('09:00', '10:30') then
    raise exception 'invalid_slot' using errcode = 'P0001';
  end if;

  if extract(isodow from p_date) not between 1 and 5 then
    raise exception 'not_a_weekday' using errcode = 'P0001';
  end if;

  if p_date <= v_today or p_date > v_today + 35 then
    raise exception 'out_of_window' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.blocked_days d where d.date = p_date) then
    raise exception 'day_blocked' using errcode = 'P0001';
  end if;

  -- Límite anti abuso: hasta 2 reservas pendientes vigentes por email.
  if (
    select count(*) from public.bookings b
    where lower(b.email) = lower(trim(p_email))
      and b.status = 'pending'
      and b.created_at > now() - public.pending_ttl()
  ) >= 2 then
    raise exception 'too_many_pending' using errcode = 'P0001';
  end if;

  -- Una pendiente vencida no debe bloquear el turno aunque el cron todavía no
  -- la haya cancelado: se libera acá mismo, en la misma transacción.
  update public.bookings b
     set status = 'cancelled', cancelled_at = now()
   where b.date = p_date
     and b.slot = p_slot
     and b.status = 'pending'
     and b.created_at <= now() - public.pending_ttl();

  insert into public.bookings (date, slot, name, email, occupation, topic)
  values (
    p_date,
    p_slot,
    trim(p_name),
    lower(trim(p_email)),
    trim(p_occupation),
    trim(p_topic)
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Solo estas dos funciones quedan expuestas al público.
revoke all on function public.get_taken_slots(date, date) from public;
revoke all on function public.create_booking(date, text, text, text, text, text) from public;
grant execute on function public.get_taken_slots(date, date) to anon, authenticated;
grant execute on function public.create_booking(date, text, text, text, text, text) to anon, authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
