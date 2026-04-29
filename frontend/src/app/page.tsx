import CTASection from "@/components/landing/CTASection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import Footer from "@/components/landing/Footer";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";

export default function LandingPage() {
  return (
    <div className="bg-black">
      <HeroSection />
      <FeaturesGrid />
      <HowItWorks />
      <CTASection />
      <Footer />
    </div>
  );
}
