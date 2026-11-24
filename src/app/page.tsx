import { Nav } from "@/components/nav";
import { SectionThemeProvider } from "@/components/section-theme";
import { HeroShutter } from "@/components/sections/hero-shutter";
import { Specialties } from "@/components/sections/specialties";
import { Consulting } from "@/components/sections/consulting";
import { Audience } from "@/components/sections/audience";
import { Process } from "@/components/sections/process";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { MistBackground } from "@/components/mist-background";

export default function Home() {
  return (
    <SectionThemeProvider>
      <Nav />
      {/* Fixed mist seen through the dark sections after the hero */}
      <MistBackground />
      <main>
        <HeroShutter />
        <Specialties />
        <Consulting />
        <Audience />
        <Process />
        <FinalCta />
      </main>
      <Footer />
    </SectionThemeProvider>
  );
}
