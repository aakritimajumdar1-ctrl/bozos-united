"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { DEPARTMENT_LIST } from "@/lib/departments";
import Nav from "@/components/Nav";

export default function HubPage() {
  const { profile, loading, can } = useAuth();
  const [stats, setStats] = useState({ guests: 0, projected: 0, booked: 0 });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const results = { guests: 0, projected: 0, booked: 0 };
      if (can("guests")) {
        const { count } = await supabase.from("guests").select("*", { count: "exact", head: true });
        results.guests = count || 0;
      }
      if (can("budget")) {
        const { data: items } = await supabase.from("event_items").select("cost,status,is_lead_option");
        const { data: extras } = await supabase.from("budget_extra").select("projected_cost,actual_cost");
        (items || []).forEach((i) => {
          if (i.status === "booked") results.booked += Number(i.cost) || 0;
          if (i.status === "booked" || (i.status === "considering" && i.is_lead_option)) {
            results.projected += Number(i.cost) || 0;
          }
        });
        (extras || []).forEach((e) => {
          results.projected += Number(e.projected_cost) || 0;
          results.booked += Number(e.actual_cost) || 0;
        });
      }
      setStats(results);

      const { data: log } = await supabase
        .from("edit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      setActivity(log || []);
    })();
  }, [profile]);

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-inksoft">Loading…</div>;
  }

  const visibleDepartments = DEPARTMENT_LIST.filter((d) => can(d.slug));
  const indianDept = visibleDepartments.find((d) => d.slug === "indian");
  const otherDepartments = visibleDepartments.filter((d) => d.slug !== "indian");

  return (
    <div className="min-h-screen">
      <Nav profile={profile} can={can} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center pb-8">
          <div className="font-display text-3xl sm:text-4xl font-semibold text-ink">Aakriti and Riley</div>
          <div className="flex items-center justify-center gap-3 my-3">
            <div className="w-14 h-px bg-ink/20" />
            <Sparkles size={14} className="text-inksoft" />
            <div className="w-14 h-px bg-ink/20" />
          </div>
          <div className="text-sm text-inksoft">Bozos united</div>
        </div>

        <div className="flex gap-2 mb-8">
          <Link href="/calendar" className="flex-1 bg-card border border-line rounded-xl p-4 hover:border-inksoft text-center">
            <div className="text-sm font-medium text-ink">Open calendar</div>
          </Link>
        </div>

        {(can("guests") || can("budget")) && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {can("guests") && (
              <Link href="/guests" className="bg-card border border-line rounded-xl p-4 hover:border-inksoft">
                <div className="text-xs text-inksoft mb-1">Guests invited</div>
                <div className="text-xl font-semibold font-mono text-ink">{stats.guests}</div>
              </Link>
            )}
            {can("budget") && (
              <Link href="/budget" className="bg-card border border-line rounded-xl p-4 hover:border-inksoft">
                <div className="text-xs text-inksoft mb-1">Projected · booked</div>
                <div className="text-xl font-semibold font-mono text-ink">
                  ${Math.round(stats.projected).toLocaleString()} · ${Math.round(stats.booked).toLocaleString()}
                </div>
              </Link>
            )}
          </div>
        )}

        {indianDept && (
          <Link
            href={`/${indianDept.slug}`}
            className="flex items-center gap-4 bg-indian-soft border-t-2 border-b-2 border-gold rounded-xl px-5 py-4 mb-3 hover:opacity-90"
          >
            <indianDept.Icon className="text-indian-accent flex-shrink-0" size={24} />
            <div className="flex-1 font-display text-lg font-semibold text-indian-deep">{indianDept.label}</div>
            <ArrowRight className="text-indian-accent" size={17} />
          </Link>
        )}

        <div className="flex flex-col">
          {otherDepartments.map((d) => (
            <Link
              key={d.slug}
              href={`/${d.slug}`}
              className="flex items-center gap-4 px-1 py-4 border-t border-line hover:bg-white/40"
            >
              <d.Icon className={d.textClass} size={20} />
              <div className="flex-1 font-display text-base font-medium text-ink">{d.label}</div>
              <ArrowRight className="text-inksoft" size={16} />
            </Link>
          ))}
          {can("prep") && (
            <Link
              href="/prep"
              className="flex items-center gap-4 px-1 py-4 border-t border-b border-line hover:bg-white/40"
            >
              <Sparkles className="text-prep" size={20} />
              <div className="flex-1 font-display text-base font-medium text-ink">Wedding prep</div>
              <ArrowRight className="text-inksoft" size={16} />
            </Link>
          )}
        </div>

        {visibleDepartments.length === 0 && !can("prep") && (
          <p className="text-sm text-inksoft text-center mt-6">
            No sections are turned on for your account yet — ask Aakriti or Riley to grant access from Admin.
          </p>
        )}

        {activity.length > 0 && (
          <div className="mt-10">
            <div className="font-display text-base font-medium text-ink mb-2">Recent activity</div>
            <div className="space-y-1">
              {activity.map((a) => (
                <div key={a.id} className="text-xs text-inksoft">
                  <span className="text-ink font-medium">{a.changed_by_name}</span> {a.summary}
                  <span className="text-inksoft/70"> · {new Date(a.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
