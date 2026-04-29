// "use client";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { Sparkles, Images, FolderOpen, LogOut, User, Menu, X } from "lucide-react";
// import { useState } from "react";
// import { cn } from "@/lib/utils";
// import { useAuthStore } from "@/store/authStore";
// import { useAuth } from "@/hooks";
// import { Button } from "@/components/ui/button";
// import { ROUTES } from "@/lib/constants";

// const NAV_LINKS = [
//   { href: ROUTES.STUDIO,      label: "Studio",      icon: Sparkles },
//   { href: ROUTES.GALLERY,     label: "Gallery",     icon: Images },
//   { href: ROUTES.COLLECTIONS, label: "Collections", icon: FolderOpen },
// ];

// export default function Navbar() {
//   const pathname = usePathname();
//   const { isAuthenticated, user } = useAuthStore();
//   const { logout } = useAuth();
//   const [mobileOpen, setMobileOpen] = useState(false);

//   const isLanding = pathname === "/";

//   return (
//     <header className={cn(
//       "fixed top-0 inset-x-0 z-50 border-b border-studio-border/50",
//       "bg-black/80 backdrop-blur-xl",
//     )}>
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

//         {/* Logo */}
//         <Link href={ROUTES.HOME} className="flex items-center gap-2.5 group">
//           <div className="w-7 h-7 rounded bg-studio-blue flex items-center justify-center text-white group-hover:glow-blue transition-all duration-300">
//             <Sparkles size={14} />
//           </div>
//           <span className="font-display font-semibold text-white tracking-tight text-[15px]">
//             AI Studio
//           </span>
//         </Link>

//         {/* Center nav — only for authenticated users */}
//         {isAuthenticated && (
//           <nav className="hidden md:flex items-center gap-1">
//             {NAV_LINKS.map(({ href, label, icon: Icon }) => (
//               <Link
//                 key={href}
//                 href={href}
//                 className={cn(
//                   "flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider transition-all duration-150",
//                   pathname.startsWith(href)
//                     ? "text-white bg-studio-surface border border-studio-border"
//                     : "text-studio-subtle hover:text-white hover:bg-studio-hover"
//                 )}
//               >
//                 <Icon size={13} />
//                 {label}
//               </Link>
//             ))}
//           </nav>
//         )}

//         {/* Right side */}
//         <div className="flex items-center gap-2">
//           {isAuthenticated ? (
//             <>
//               <div className="hidden md:flex items-center gap-2 mr-2">
//                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-studio-border bg-studio-surface">
//                   <User size={12} className="text-studio-subtle" />
//                   <span className="font-mono text-xs text-studio-subtle">{user?.username}</span>
//                 </div>
//               </div>
//               <Button
//                 variant="ghost"
//                 size="icon-sm"
//                 onClick={logout}
//                 title="Logout"
//               >
//                 <LogOut size={14} />
//               </Button>
//             </>
//           ) : (
//             <>
//               <Link href={ROUTES.LOGIN}>
//                 <Button variant="ghost" size="sm">Sign In</Button>
//               </Link>
//               <Link href={ROUTES.REGISTER}>
//                 <Button variant="default" size="sm">Get Started</Button>
//               </Link>
//             </>
//           )}

//           {/* Mobile toggle */}
//           {isAuthenticated && (
//             <button
//               className="md:hidden p-1.5 text-studio-subtle hover:text-white"
//               onClick={() => setMobileOpen(!mobileOpen)}
//             >
//               {mobileOpen ? <X size={18} /> : <Menu size={18} />}
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Mobile nav */}
//       {isAuthenticated && mobileOpen && (
//         <div className="md:hidden border-t border-studio-border bg-black/95 px-4 py-3 flex flex-col gap-1 animate-slide-down">
//           {NAV_LINKS.map(({ href, label, icon: Icon }) => (
//             <Link
//               key={href}
//               href={href}
//               onClick={() => setMobileOpen(false)}
//               className={cn(
//                 "flex items-center gap-2 px-3 py-2 rounded font-mono text-sm transition-colors",
//                 pathname.startsWith(href)
//                   ? "text-white bg-studio-surface"
//                   : "text-studio-subtle hover:text-white"
//               )}
//             >
//               <Icon size={14} /> {label}
//             </Link>
//           ))}
//           <div className="pt-2 border-t border-studio-border mt-1">
//             <button
//               onClick={logout}
//               className="flex items-center gap-2 px-3 py-2 text-studio-subtle hover:text-white font-mono text-sm w-full"
//             >
//               <LogOut size={14} /> Logout
//             </button>
//           </div>
//         </div>
//       )}
//     </header>
//   );
// }








"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Images, FolderOpen, LogOut, User, Menu, X, Wand2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

const NAV_LINKS = [
  { href: ROUTES.STUDIO,      label: "Studio",      icon: FolderOpen },
  { href: ROUTES.EDITOR,      label: "Editor",      icon: Wand2 },
  { href: ROUTES.GALLERY,     label: "Gallery",     icon: Images },
  { href: ROUTES.COLLECTIONS, label: "Collections", icon: FolderOpen },
];

// Custom Minimalist Logo Component to replace the Sparkle icon
const StudioLogoIcon = () => (
  <div className="relative w-6 h-6">
    <div className="absolute inset-0 bg-blue-600 rounded-lg rotate-45 group-hover:rotate-90 transition-transform duration-500" />
    <div className="absolute inset-[20%] bg-black rounded-sm" />
    <div className="absolute top-[20%] right-[20%] w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
  </div>
);

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-50 border-b border-white/[0.05]",
      // Slightly transparent glass effect
      "bg-black/[0.15] backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl",
      "transition-all duration-300"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">

        {/* Logo Section */}
        <Link href={ROUTES.HOME} className="flex items-center gap-4 group">
          <StudioLogoIcon />
          <span className="font-display font-bold text-white tracking-tight text-[16px]">
            AI Studio
          </span>
        </Link>

        {/* Center Nav - Floating Capsule Style */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.05] backdrop-blur-sm">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-5 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-300",
                    isActive
                      ? "text-white bg-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                      : "text-zinc-500 hover:text-white hover:bg-white/[0.02]"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.05] bg-white/[0.03]">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">{user?.username}</span>
                </div>
              </div>
              <button
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                onClick={logout}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-6">
              <Link href={ROUTES.LOGIN}>
                <button className="text-zinc-400 hover:text-white text-[12px] font-mono uppercase tracking-widest transition-colors">
                  Sign In
                </button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 h-9 text-[12px] font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all hover:scale-105"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          {isAuthenticated && (
            <button
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isAuthenticated && mobileOpen && (
        <div className="md:hidden border-t border-white/[0.05] bg-black/90 backdrop-blur-2xl px-6 py-6 flex flex-col gap-4">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "font-mono text-[12px] uppercase tracking-[0.2em] transition-colors",
                pathname.startsWith(href) ? "text-blue-400" : "text-zinc-500"
              )}
            >
              {label}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/[0.05]">
            <button
              onClick={logout}
              className="flex items-center gap-3 text-red-500/70 font-mono text-[12px] uppercase tracking-widest"
            >
              <LogOut size={14} /> Logout Session
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
