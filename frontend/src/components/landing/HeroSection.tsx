import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import ScrollRevealSection from "./ScrollRevealSection";

const SAMPLE_IMAGES = [
  { url: "https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=800", tag: "GEN-2" },
  { url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800", tag: "DALL-E" },
  { url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800", tag: "4K RES" },
  { url: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=800", tag: "LATENT" },
  { url: "https://images.unsplash.com/photo-1614850523296-e8c0a97323bc?q=80&w=800", tag: "PROMPT" },
  { url: "https://images.unsplash.com/photo-1620121692029-d088224efc74?q=80&w=800", tag: "STUDIO" },
  { url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800", tag: "NEURAL" },
  { url: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=800", tag: "RAW" },
];

export default function HeroSection() {
  return (
    <ScrollRevealSection>
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#030303]">
        <style dangerouslySetInnerHTML={{ __html: `
          .bg-grid-unified {
            background-image:
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
            background-size: 50px 50px;
            background-position: center top;
          }
          @keyframes breathe {
            0%, 100% { opacity: 0.5; transform: scale(1) translateY(0); }
            50% { opacity: 0.75; transform: scale(1.02) translateY(-8px); }
          }
          .animate-breathe {
            animation: breathe 12s ease-in-out infinite;
          }
        `}} />

        <div className="absolute inset-0 bg-grid-unified pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none" />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-8 py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-8">
              <Star size={11} className="text-blue-400" fill="currentColor" />
              <span className="font-mono text-xs text-blue-400 tracking-wider uppercase">
                Powered by DALL-E 3
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-semibold leading-[1.0] tracking-tight text-white mb-6">
              Create images
              <br />
              <span className="text-blue-500">from thought.</span>
            </h1>

            <p className="font-body text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-10">
              A professional AI image generation and editing studio. Generate stunning visuals,
              edit with precision, manage your creative library - all in one place.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href={ROUTES.REGISTER}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white gap-2.5 text-[15px] px-8 shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all">
                  <Sparkles size={16} />
                  Start Creating Free
                </Button>
              </Link>
              <Link href={ROUTES.LOGIN}>
                <Button size="lg" variant="outline" className="border-zinc-800 text-white hover:bg-zinc-900 gap-2 text-[15px]">
                  Sign In
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 mt-16">
              {[
                { n: "15+", label: "Style presets" },
                { n: "6", label: "Aspect ratios" },
                { n: "4", label: "Batch generate" },
                { n: "∞", label: "Gallery storage" },
              ].map(({ n, label }) => (
                <div key={label}>
                  <div className="font-display text-3xl text-white">{n}</div>
                  <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute right-[-8%] top-0 h-full w-[55%] hidden lg:block overflow-hidden pointer-events-none select-none z-10">
          <div className="grid grid-cols-2 gap-8 h-full p-8 -rotate-12 scale-110 translate-x-12">
            {SAMPLE_IMAGES.map((img, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 animate-breathe shadow-2xl"
                style={{
                  height: `${[340, 420, 320, 380, 440, 350, 370, 330][i]}px`,
                  animationDelay: `${i * 1.5}s`,
                }}
              >
                <img
                  src={img.url}
                  alt="AI Sample"
                  className="w-full h-full object-cover opacity-60 grayscale-[40%] brightness-90 contrast-110"
                />
                <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/80 via-black/10 to-transparent">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] text-white/50 tracking-[0.3em] uppercase">
                      {img.tag} // STU-0{i + 1}
                    </span>
                    <div className="w-8 h-[1px] bg-blue-500/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollRevealSection>
  );
}
