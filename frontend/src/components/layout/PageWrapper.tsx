"use client";

import { usePathname } from "next/navigation";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="page-transition relative min-h-[calc(100dvh-3.5rem)] overflow-x-hidden isolate"
    >
      {children}
    </div>
  );
}
