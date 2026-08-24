"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { DEPARTMENT_LIST } from "@/lib/departments";

export default function Nav({ profile, can }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const links = [
    { href: "/", label: "Home" },
    ...DEPARTMENT_LIST.filter((d) => can(d.slug)).map((d) => ({ href: `/${d.slug}`, label: d.label })),
    { href: "/calendar", label: "Calendar" },
    ...(can("guests") ? [{ href: "/guests", label: "Guest list" }] : []),
    ...(can("budget") ? [{ href: "/budget", label: "Budget" }] : []),
    ...(can("prep") ? [{ href: "/prep", label: "Wedding prep" }] : []),
    ...(profile?.permissions?.includes("admin") ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="border-b border-line bg-cream/95 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-lg font-semibold text-ink whitespace-nowrap">
          Bozos United
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
                pathname === l.href ? "bg-ink text-cream" : "text-inksoft hover:bg-line/50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-inksoft hidden sm:inline">{profile?.display_name}</span>
          <button onClick={signOut} className="text-xs text-inksoft underline">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
