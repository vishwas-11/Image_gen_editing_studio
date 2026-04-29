import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import ScrollRevealSection from "./ScrollRevealSection";

export default function CTASection() {
  return (
    <ScrollRevealSection>
      <section className="relative py-32 overflow-hidden bg-[#030303]">
        <style dangerouslySetInnerHTML={{ __html: `
          .bg-grid-shared {
            background-image: linear-gradient(to right, #ffffff08 1px, transparent 1px),
                              linear-gradient(to bottom, #ffffff08 1px, transparent 1px);
            background-size: 50px 50px;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(-12deg) scale(1.1); }
            50% { transform: translateY(-20px) rotate(-10deg) scale(1.15); }
          }
          .animate-float-slow {
            animation: float 10s ease-in-out infinite;
          }
        `}} />

        <div className="absolute inset-0 bg-grid-shared pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#050505] p-12 sm:p-24 text-center shadow-2xl">
            <div className="absolute -left-20 -bottom-20 w-80 h-96 opacity-30 blur-[2px] hidden lg:block animate-float-slow">
              <img
                src="https://images.unsplash.com/photo-1620121692029-d088224efc74?q=80&w=800"
                className="w-full h-full object-cover rounded-3xl grayscale brightness-50"
                alt=""
              />
            </div>
            <div className="absolute -right-20 -top-20 w-80 h-96 opacity-30 blur-[2px] hidden lg:block animate-float-slow [animation-delay:2s]">
              <img
                src="https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=800"
                className="w-full h-full object-cover rounded-3xl grayscale brightness-50"
                alt=""
              />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/10 blur-[120px] pointer-events-none" />

            <div className="relative z-10">
              <span className="font-mono text-[10px] text-blue-500 uppercase tracking-[0.4em] font-bold mb-6 block">
                Get Started
              </span>

              <h2 className="font-display text-4xl sm:text-6xl text-white mb-6 tracking-tight font-semibold">
                Start generating <br />
                <span className="text-blue-500">today.</span>
              </h2>

              <p className="font-mono text-xs sm:text-sm text-zinc-500 mb-12 max-w-md mx-auto leading-relaxed uppercase tracking-wider">
                Free to sign up. No credit card required <br />
                to explore the future of AI.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6">
                <Link href={ROUTES.REGISTER}>
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white gap-2.5 h-14 px-10 text-base shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:scale-105">
                    <Sparkles size={18} />
                    Create your account
                  </Button>
                </Link>
                <Link href={ROUTES.LOGIN}>
                  <Button size="lg" variant="outline" className="h-14 px-10 text-base border-zinc-800 text-white hover:bg-zinc-900 transition-all">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ScrollRevealSection>
  );
}
