// import { Sparkles } from "lucide-react";

// export default function Footer() {
//   return (
//     <footer className="relative py-12 overflow-hidden bg-[#030303]">
//       <style
//         dangerouslySetInnerHTML={{
//           __html: `
//           .bg-grid-shared {
//             background-image: linear-gradient(to right, #ffffff08 1px, transparent 1px),
//                               linear-gradient(to bottom, #ffffff08 1px, transparent 1px);
//             background-size: 50px 50px;
//             background-position: center top;
//           }
//         `,
//         }}
//       />

//       <div className="absolute inset-0 bg-grid-shared pointer-events-none" />
//       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[100px] bg-blue-600/5 blur-[80px] pointer-events-none" />

//       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
//         <div className="flex items-center gap-3">
//           <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
//             <Sparkles size={12} className="text-white" />
//           </div>
//           <span className="font-display text-sm font-semibold text-white tracking-tight">
//             AI Image Studio
//           </span>
//         </div>

//         <div className="flex flex-col sm:items-end gap-1">
//           <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] leading-none">
//             Tech Stack // Production
//           </p>
//           <p className="font-mono text-[11px] text-zinc-400 tracking-wide">
//             DALL-E 3 | FastAPI | Next.js 14
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// }










import { ROUTES } from "@/lib/constants";
import Link from "next/link";

// Custom Minimalist Logo Component to match the Navbar
const StudioLogoIcon = () => (
  <div className="relative w-5 h-5">
    <div className="absolute inset-0 bg-blue-600 rounded-md rotate-45" />
    <div className="absolute inset-[20%] bg-[#030303] rounded-sm" />
    <div className="absolute top-[20%] right-[20%] w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
  </div>
);

export default function Footer() {
  return (
    <footer className="relative py-16 overflow-hidden bg-[#030303]">
      {/* Shared Grid Style - Exact alignment with Hero/Features/CTA */}
      <style dangerouslySetInnerHTML={{ __html: `
        .bg-grid-shared {
          background-image: linear-gradient(to right, #ffffff08 1px, transparent 1px),
                            linear-gradient(to bottom, #ffffff08 1px, transparent 1px);
          background-size: 50px 50px;
          background-position: center top;
        }
      `}} />

      {/* Background Grid Layer */}
      <div className="absolute inset-0 bg-grid-shared pointer-events-none" />

      {/* Final "System Glow" at the bottom edge */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[120px] bg-blue-600/[0.07] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-8">
        
        {/* Branding Area */}
        <Link href={ROUTES.HOME} className="flex items-center gap-3 group transition-opacity hover:opacity-80">
          <StudioLogoIcon />
          <span className="font-display text-sm font-bold text-white tracking-tight">
            AI Studio
          </span>
        </Link>

        {/* Technical Stack & Status */}
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.3em] leading-none">
              System // Operational
            </p>
          </div>
          
          <div className="flex flex-col sm:items-end gap-1">
             <p className="font-mono text-[10px] text-zinc-400 tracking-wider">
              DALL-E 3 · FastAPI · Next.js 14
            </p>
            <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.1em]">
              &copy; {new Date().getFullYear()} AI Studio Labs
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}