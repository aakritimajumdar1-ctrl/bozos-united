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
        <div
          className="flex items-center gap-4 rounded-2xl px-5 py-5 mb-6"
          style={{
            background: `linear-gradient(135deg, ${theme.softHex} 0%, #FFFFFF 75%)`,
            border: `1px solid ${theme.hex}33`,
            borderTop: `3px solid ${theme.hex}`,
            boxShadow: "0 3px 16px rgba(74,27,12,0.06)",
          }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.hex }}>
            <theme.Icon size={22} color="#FFFFFF" />
          </div>
          <div className="font-display text-2xl font-semibold" style={{ color: theme.deepHex }}>{theme.label}</div>
        </div>
        <DepartmentBoard department="american" theme={theme} />
      </div>
    </div>
  );
}
