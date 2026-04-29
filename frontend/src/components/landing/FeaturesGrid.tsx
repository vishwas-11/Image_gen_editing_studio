import { Brush, Crop, ImageIcon, Layers, Sparkles, Wand2 } from "lucide-react";
import ScrollRevealSection from "./ScrollRevealSection";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Text-to-Image Generation",
    desc: "Generate stunning images from natural language. Support for 15+ artistic styles, all aspect ratios, and quality levels from Draft to Ultra.",
    color: "#3b82f6",
    bgImg: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600",
  },
  {
    icon: Brush,
    title: "Inpainting Canvas",
    desc: "Paint over any region of an image to regenerate it. Fabric.js-powered canvas with adjustable brush, eraser, and mask preview.",
    color: "#a855f7",
    bgImg: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=600",
  },
  {
    icon: Crop,
    title: "Outpainting",
    desc: "Extend your images beyond their borders. Select directions and let AI generate seamlessly matching content.",
    color: "#10b981",
    bgImg: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600",
  },
  {
    icon: Layers,
    title: "Background Removal",
    desc: "One-click AI background removal. Export as transparent PNG, replace with solid color, or generate an AI background from a prompt.",
    color: "#f59e0b",
    bgImg: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600",
  },
  {
    icon: Wand2,
    title: "Prompt Enhancement",
    desc: "Transform simple prompts into detailed, high-quality generation prompts using GPT-4. Includes prompt templates and a Surprise Me generator.",
    color: "#ef4444",
    bgImg: "https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=600",
  },
  {
    icon: ImageIcon,
    title: "Gallery & Collections",
    desc: "Masonry grid gallery with full-text search, favorites, custom tags, and collections. Batch download as ZIP in multiple formats.",
    color: "#6366f1",
    bgImg: "https://images.unsplash.com/photo-1614850523296-e8c0a97323bc?q=80&w=600",
  },
];

export default function FeaturesGrid() {
  return (
    <ScrollRevealSection>
      <section className="relative py-32 overflow-hidden bg-[#030303]">
        <div className="absolute inset-0 bg-grid-unified pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
          <div className="mb-20">
            <span className="font-mono text-[10px] text-blue-500 uppercase tracking-[0.3em] font-bold">
              Capabilities
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white mt-4 tracking-tight font-semibold">
              Everything you need
              <br />
              <span className="text-zinc-500">to create at scale.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            {FEATURES.map(({ icon: Icon, title, desc, color, bgImg }, i) => (
              <div
                key={title}
                className="group relative bg-[#050505] p-10 transition-all duration-300 hover:bg-zinc-900/40 overflow-hidden"
              >
                <div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <img
                    src={bgImg}
                    alt=""
                    className="w-full h-full object-cover grayscale-[30%] brightness-[0.4] scale-110 group-hover:scale-100 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]" />
                </div>

                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: `${color}15`,
                      color,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </div>

                  <h3 className="font-display text-xl text-white mb-4 tracking-tight group-hover:text-blue-400 transition-colors">
                    {title}
                  </h3>

                  <p className="font-mono text-[11px] text-zinc-400 leading-relaxed tracking-wide group-hover:text-zinc-200 transition-colors">
                    {desc}
                  </p>

                  <div className="mt-8 flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-all duration-500">
                    <div className="h-[1px] w-6 bg-blue-500" />
                    <span className="font-mono text-[9px] text-blue-400 tracking-[0.2em]">
                      STU-FEAT-0{i + 1}
                    </span>
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
