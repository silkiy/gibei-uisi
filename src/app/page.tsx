import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { DivisionsSection } from "@/components/home/DivisionsSection";
import { MembersSection } from "@/components/home/MembersSection";
import { PublicationSection } from "@/components/home/PublicationSection";
import { EventsSection } from "@/components/home/EventsSection";
import { RecruitmentSection } from "@/components/home/RecruitmentSection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { ContactSection } from "@/components/home/ContactSection";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Lewati ke konten utama
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <AboutSection />
        <DivisionsSection />
        <MembersSection />
        <PublicationSection />
        <EventsSection />
        <RecruitmentSection />
        <ContactSection />
        <PartnersSection />
      </main>
      <SiteFooter />
    </>
  );
}
