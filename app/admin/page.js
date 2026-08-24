"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { ALL_PERMISSIONS } from "@/lib/departments";
import Nav from "@/components/Nav";

export default function AdminPage() {
  const { profile, loading, can } = useAuth();
  const [people, setPeople] = useState([]);

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("display_name");
    setPeople(data || []);
  };

  useEffect(() => {
    if (profile?.permissions?.includes("admin")) load();
  }, [profile]);

  const togglePermission = async (personId, perm, currentPermissions) => {
    const has = currentPermissions.includes(perm);
    const next = has ? currentPermissions.filter((p) => p !== perm) : [...currentPermissions, perm];
    setPeople(people.map((p) => (p.id === personId ? { ...p, permissions: next } : p)));
    await supabase.from("profiles").update({ permissions: next }).eq("id", personId);
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-inksoft">Loading…</div>;
  }
  if (!profile.permissions?.includes("admin")) {
    return (
      <div className="min-h-screen">
        <Nav profile={profile} can={can} />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center text-sm text-inksoft">
          Only Aakriti and Riley can manage access.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Nav profile={profile} can={can} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="font-display text-2xl font-semibold text-ink mb-1">Admin</div>
        <p className="text-sm text-inksoft mb-6">Choose which sections each person can see and edit.</p>

        <div className="space-y-4">
          {people.map((p) => (
            <div key={p.id} className="bg-card border border-line rounded-xl p-4">
              <div className="font-medium text-sm text-ink mb-2">{p.display_name}</div>
              <div className="flex flex-wrap gap-2">
                {ALL_PERMISSIONS.map((perm) => {
                  const active = p.permissions?.includes(perm);
                  return (
                    <button
                      key={perm}
                      onClick={() => togglePermission(p.id, perm, p.permissions || [])}
                      className={`text-xs px-2.5 py-1 rounded-full border ${
                        active ? "bg-ink text-cream border-ink" : "border-line text-inksoft"
                      }`}
                    >
                      {perm}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
