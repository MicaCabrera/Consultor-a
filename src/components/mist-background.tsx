"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";

/*
 * Fixed volumetric mist behind the dark sections (those rendered with
 * <Section mist>), modelled on psychoactive.co.nz/about:
 *
 *  - One `position: fixed` layer behind the whole page. Dark "mist" sections
 *    are transparent, so they all look through the same mist: one continuous
 *    background, not a background per section. Light sections and the hero
 *    stay opaque and cover it.
 *  - A WebGL2 ray-marched fog (own shader, no three.js), rendered at low
 *    resolution and stretched, which is what makes it soft and cheap.
 *  - The camera keeps flying into the fog. Scrolling speeds that flight up
 *    with the scroll velocity, the same coupling as the reference:
 *      velocity (viewports/s, max 6) eased 8% per frame,
 *      travel += dt * (0.35 + velocity * 2.5).
 *  - Slight cursor parallax, plus CSS scanlines with a slow rolling sheen.
 *
 * It only renders while a mist section is on screen and the tab is visible.
 * With reduced motion it draws one still frame.
 */

// Site palette: the bg-dark base and the accent green, kept dim.
const BASE = [0x0a / 255, 0x0b / 255, 0x0a / 255];
const DEEP = [0.03, 0.17, 0.13];
const GLOW = [0.13, 0.5, 0.39];

const PIXEL_BUDGET = 100_000; // like the reference: ~396x247 at 1440x900
const PIXEL_BUDGET_SMALL = 60_000;

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp sampler3D;
uniform sampler3D uNoise;
uniform vec2 uRes;
uniform float uTime;
uniform float uTravel;
uniform vec2 uParallax;
uniform vec3 uBase;
uniform vec3 uDeep;
uniform vec3 uGlow;
out vec4 outColor;

float fbm(vec3 p) {
  float sum = 0.0, amp = 0.55;
  for (int i = 0; i < 3; i++) {
    sum += amp * texture(uNoise, p).r;
    p = p * 2.07 + 0.17;
    amp *= 0.45;
  }
  return sum / 0.9;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = normalize(vec3(uv, -1.4));
  vec3 ro = vec3(uParallax * 0.35, 0.0);

  const int STEPS = 24;
  const float STEP = 0.36;
  float t = 0.5;
  float trans = 1.0;
  vec3 acc = vec3(0.0);

  for (int i = 0; i < STEPS; i++) {
    vec3 p = ro + rd * t;
    // Flying forward through the fog: travel moves the field towards us.
    vec3 q = p * 0.045 + vec3(uTime * 0.0035, uTime * 0.002, -uTravel * 0.045);
    float d = smoothstep(0.36, 0.76, fbm(q));
    if (d > 0.002) {
      float depth = t / (float(STEPS) * STEP);
      vec3 c = mix(uDeep, uGlow, smoothstep(0.15, 1.0, d)) * (1.0 - depth * 0.65);
      float a = d * 0.27;
      acc += trans * a * c;
      trans *= 1.0 - a;
      if (trans < 0.02) break;
    }
    t += STEP;
  }

  vec3 col = uBase * trans + acc;
  float vig = smoothstep(1.25, 0.3, length(uv * vec2(0.85, 1.1)));
  col *= mix(0.5, 1.0, vig);
  outColor = vec4(col, 1.0);
}`;

/**
 * 32³ tileable smooth noise: random values, blurred twice with wrap-around
 * (so it stays tileable), then stretched back to the full 0–255 range.
 * REPEAT + trilinear filtering on the GPU does the rest.
 */
function noiseVolume(size = 32) {
  const n = size * size * size;
  let a = new Float32Array(n);
  let seed = 1337;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    a[i] = seed / 4294967296;
  }
  const idx = (x: number, y: number, z: number) =>
    ((z + size) % size) * size * size + ((y + size) % size) * size + ((x + size) % size);
  for (let pass = 0; pass < 2; pass++) {
    const b = new Float32Array(n);
    for (let z = 0; z < size; z++)
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          let sum = 0;
          for (let dz = -1; dz <= 1; dz++)
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) sum += a[idx(x + dx, y + dy, z + dz)];
          b[idx(x, y, z)] = sum / 27;
        }
    a = b;
  }
  let min = 1, max = 0;
  for (const v of a) { if (v < min) min = v; if (v > max) max = v; }
  const data = new Uint8Array(n);
  for (let i = 0; i < n; i++) data[i] = Math.round(((a[i] - min) / (max - min)) * 255);
  return { data, size };
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
  }
  return sh;
}

export function MistBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useSafeReducedMotion();
  // A mist section is (nearly) on screen.
  const [active, setActive] = useState(false);

  // Watch the mist sections.
  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        setActive(visible.size > 0);
      },
      { rootMargin: "25% 0px 25% 0px" }
    );
    document.querySelectorAll("section[data-mist]").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // WebGL: set up once, render while active.
  const state = useRef<{
    draw: () => void;
    resize: () => void;
    tick: (now: number) => void;
    reset: () => void;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    // No WebGL2 (or a lost context): the dark sections simply show the page colour.
    if (!gl || gl.isContextLost()) return;

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    } catch (err) {
      console.warn("Mist background disabled:", err);
      return;
    }
    gl.useProgram(prog);
    gl.bindVertexArray(gl.createVertexArray());

    const { data, size } = noiseVolume();
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8, size, size, size, 0, gl.RED, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    for (const w of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R]) {
      gl.texParameteri(gl.TEXTURE_3D, w, gl.REPEAT);
    }

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u("uRes"), uTime = u("uTime"), uTravel = u("uTravel"), uParallax = u("uParallax");
    gl.uniform1i(u("uNoise"), 0);
    gl.uniform3fv(u("uBase"), BASE);
    gl.uniform3fv(u("uDeep"), DEEP);
    gl.uniform3fv(u("uGlow"), GLOW);

    let time = 0;
    let travel = Math.random() * 40;
    let velocity = 0;
    let lastY = window.scrollY;
    let last = 0;
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      const budget = w < 768 ? PIXEL_BUDGET_SMALL : PIXEL_BUDGET;
      const scale = Math.min(1, Math.sqrt(budget / (w * h)));
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const draw = () => {
      gl.uniform1f(uTime, time);
      gl.uniform1f(uTravel, travel);
      gl.uniform2f(uParallax, pointer.sx, pointer.sy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      const y = window.scrollY;
      const speed = dt > 0 ? Math.abs(y - lastY) / window.innerHeight / dt : 0;
      lastY = y;
      velocity += (Math.min(speed, 6) - velocity) * 0.08;
      time += dt;
      travel += dt * (0.35 + velocity * 2.5);
      const k = 1 - Math.exp(-dt * 2.5);
      pointer.sx += (pointer.x - pointer.sx) * k;
      pointer.sy += (pointer.y - pointer.sy) * k;
      draw();
    };

    // Start fresh after a pause, so the flight doesn't jump.
    const reset = () => {
      last = 0;
      lastY = window.scrollY;
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = -(e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    resize();
    draw();
    state.current = { draw, resize, tick, reset };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      state.current = null;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      // Free the resources but keep the context: the same canvas hands it
      // back if the component mounts again (e.g. React's dev double mount).
      gl.deleteTexture(tex);
      gl.deleteProgram(prog);
    };
  }, []);

  // Render loop: only while a mist section is visible and the tab is shown.
  useEffect(() => {
    const s = state.current;
    if (!s || !active) return;
    if (reduce) {
      s.draw();
      return;
    }
    let frame = 0;
    let running = false;
    const loop = (now: number) => {
      s.tick(now);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || document.hidden) return;
      running = true;
      s.reset();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, reduce]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ visibility: active ? "visible" : "hidden" }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {/* Scanlines with a slow rolling sheen, as in the reference */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(rgba(0,0,0,0.13) 0px, rgba(0,0,0,0) 1.5px, rgba(0,0,0,0.13) 3px)",
        }}
      >
        {active && !reduce && (
          <motion.div
            className="absolute inset-x-0 top-0 h-[35vh] will-change-transform"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.04), rgba(255,255,255,0))",
            }}
            initial={{ y: "-35vh" }}
            animate={{ y: "100vh" }}
            transition={{ duration: 16, ease: "linear", repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}
