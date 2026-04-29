"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, Images, FolderOpen, LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

const NAV_LINKS = [
  { href: ROUTES.STUDIO,      label: "Studio",      icon: Sparkles },
  { href: ROUTES.GALLERY,     label: "Gallery",     icon: Images },
  { href: ROUTES.COLLECTIONS, label: "Collections", icon: FolderOpen },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLanding = pathname === "/";

  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-50 border-b border-studio-border/50",
      "bg-black/80 backdrop-blur-xl",
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href={ROUTES.HOME} className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-studio-blue flex items-center justify-center text-white group-hover:glow-blue transition-all duration-300">
            <Sparkles size={14} />
          </div>
          <span className="font-display font-semibold text-white tracking-tight text-[15px]">
            AI Studio
          </span>
        </Link>

        {/* Center nav — only for authenticated users */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider transition-all duration-150",
                  pathname.startsWith(href)
                    ? "text-white bg-studio-surface border border-studio-border"
                    : "text-studio-subtle hover:text-white hover:bg-studio-hover"
                )}
              >
                <Icon size={13} />
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-2 mr-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-studio-border bg-studio-surface">
                  <User size={12} className="text-studio-subtle" />
                  <span className="font-mono text-xs text-studio-subtle">{user?.username}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={logout}
                title="Logout"
              >
                <LogOut size={14} />
              </Button>
            </>
          ) : (
            <>
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button variant="default" size="sm">Get Started</Button>
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          {isAuthenticated && (
            <button
              className="md:hidden p-1.5 text-studio-subtle hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {isAuthenticated && mobileOpen && (
        <div className="md:hidden border-t border-studio-border bg-black/95 px-4 py-3 flex flex-col gap-1 animate-slide-down">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded font-mono text-sm transition-colors",
                pathname.startsWith(href)
                  ? "text-white bg-studio-surface"
                  : "text-studio-subtle hover:text-white"
              )}
            >
              <Icon size={14} /> {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-studio-border mt-1">
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-studio-subtle hover:text-white font-mono text-sm w-full"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}