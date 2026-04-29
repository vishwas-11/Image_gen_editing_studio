import ScrollRevealSection from "./ScrollRevealSection";

const STEPS = [
  { n: "01", title: "Write your prompt", desc: "Describe what you want to create. Use the prompt builder or enhancer to get the best results." },
  { n: "02", title: "Choose your style", desc: "Select from 15+ artistic style presets, set aspect ratio and quality level." },
  { n: "03", title: "Generate & refine", desc: "Generate up to 4 images at once. Edit with inpainting, remove backgrounds, or create variations." },
  { n: "04", title: "Manage & export", desc: "Save to your gallery, organise into collections, download in PNG, JPEG, or WebP." },
];

export default function HowItWorks() {
  return (
    <ScrollRevealSection>
      <section className="relative py-32 overflow-hidden bg-[#030303]">
        <style dangerouslySetInnerHTML={{ __html: `
          .bg-grid-shared {
            background-image: linear-gradient(to right, #ffffff08 1px, transparent 1px),
                              linear-gradient(to bottom, #ffffff08 1px, transparent 1px);
            background-size: 50px 50px;
          }
        `}} />

        <div className="absolute inset-0 bg-grid-shared pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-600/[0.03] blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
          <div className="mb-20">
            <span className="font-mono text-[10px] text-blue-500 uppercase tracking-[0.3em] font-bold">
              Workflow
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white mt-4 tracking-tight font-semibold">
              From prompt to publish
              <br />
              <span className="text-zinc-500">in minutes.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} className="group relative">
                {i < STEPS.length - 1 && (
                  <div className="absolute top-6 left-[calc(100%+10%)] w-[40%] h-[1px] bg-gradient-to-r from-blue-500/30 to-transparent hidden lg:block" />
                )}

                <div className="relative inline-block mb-6">
                  <div className="font-mono text-5xl font-light text-zinc-800 group-hover:text-blue-500/50 transition-colors duration-500">
                    {n}
                  </div>
                  <div className="absolute -inset-2 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>

                <h3 className="font-display text-xl text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors duration-300">
                  {title}
                </h3>

                <p className="font-mono text-[11px] text-zinc-500 leading-relaxed tracking-wide group-hover:text-zinc-300 transition-colors duration-300">
                  {desc}
                </p>

                <div className="mt-6 w-10 h-[1px] bg-zinc-800 group-hover:w-16 group-hover:bg-blue-600 transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollRevealSection>
  );
}
