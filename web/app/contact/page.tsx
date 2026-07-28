import CTA from "@/components/layout/CTA";
import FAQSection from "@/sections/contact-section/FAQSection";
import ContactHero from "@/sections/contact-section/ContactHero";
import HomeCTA from "@/sections/HomeCTA";

export default function ContactPage() {
    return (
        <main>
            <ContactHero />
            <FAQSection />

            <HomeCTA />
        </main>
    );
}