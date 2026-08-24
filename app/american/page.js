"use client";

import { useAuth } from "@/lib/useAuth";
import { DEPARTMENTS } from "@/lib/departments";
import Nav from "@/components/Nav";
import DepartmentBoard from "@/components/DepartmentBoard";

const theme = DEPARTMENTS.american;

export default function AmericanPage() {
  const { profile, loading, can } = useAuth();

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-inksoft">Loading…</div>;
  }
  if (!can("american")) {
    return (
      <div className="min-h-screen">
        <Nav profile={profile} can={can} />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center text-sm text-inksoft">
          You don't have access to this section yet.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Nav profile={profile} can={can} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <theme.Icon className={theme.textClass} size={26} />
          <div className="font-display text-2xl font-semibold text-ink">{theme.label}</div>
        </div>
        <DepartmentBoard department="american" theme={theme} />
      </div>
    </div>
  );
}
