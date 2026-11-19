import { Nav } from "@/components/nav";
import { SectionThemeProvider } from "@/components/section-theme";
import { HeroShutter } from "@/components/sections/hero-shutter";
import { Specialties } from "@/components/sections/specialties";
import { Consulting } from "@/components/sections/consulting";
import { Audience } from "@/components/sections/audience";
import { Process } from "@/components/sections/process";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <SectionThemeProvider>
      <Nav />
      <main>
        <HeroShutter />
        <Specialties />
        <Consulting />
        <Audience />
        <Process />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </SectionThemeProvider>
  );
}
