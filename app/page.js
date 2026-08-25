"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Users, Wallet, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { DEPARTMENT_LIST } from "@/lib/departments";
import Nav from "@/components/Nav";

function DepartmentCard({ d, big }) {
  return (
    <Link
      href={`/${d.slug}`}
      className="group flex items-center gap-4 rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${d.softHex} 0%, #FFFFFF 70%)`,
        border: `1px solid ${d.hex}33`,
        boxShadow: "0 3px 16px rgba(74,27,12,0.07)",
        borderTop: `3px solid ${d.hex}`,
      }}
    >
      <div
        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
        style={{ backgroundColor: d.hex }}
      >
        <d.Icon size={big ? 22 : 19} color="#FFFFFF" />
      </div>
      <div className="flex-1">
        <div className={`font-display font-semibold ${big ? "text-lg" : "text-base"}`} style={{ color: d.deepHex }}>
          {d.label}
        </div>
      </div>
      <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" style={{ color: d.hex }} />
    </Link>
  );
}

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
        <div className="relative text-center pb-9">
          <svg width="46" height="46" viewBox="0 0 46 46" className="mx-auto mb-2 opacity-80">
            <path
              d="M23 6c-6 6-6 13 0 19 6-6 6-13 0-19z"
              fill="none"
              stroke="#7A1F2B"
              strokeWidth="1.2"
            />
            <path
              d="M23 23c-9 0-15 7-15 16 9 2 16-3 15-16z"
              fill="none"
              stroke="#1B3A5C"
              strokeWidth="1.2"
            />
            <path
              d="M23 23c9 0 15 7 15 16-9 2-16-3-15-16z"
              fill="none"
              stroke="#C79A46"
              strokeWidth="1.2"
            />
          </svg>
          <div className="font-display text-4xl sm:text-5xl font-semibold text-ink tracking-tight">
            Aakriti <span className="italic font-normal text-maroon">and</span> Riley
          </div>
          <div className="ornament-divider my-3">
            <span className="line" style={{ background: "linear-gradient(90deg, transparent, #7A1F2B, transparent)" }} />
            <Sparkles size={13} className="text-navy" />
            <span className="line" style={{ background: "linear-gradient(90deg, transparent, #1B3A5C, transparent)" }} />
          </div>
          <div className="text-sm tracking-wide text-inksoft">Bozos united</div>
        </div>

        {(can("guests") || can("budget")) && (
          <div className="grid grid-cols-3 gap-2.5 mb-8">
            <Link href="/calendar" className="gilded-card navy-top p-3 text-center hover:-translate-y-0.5 transition-transform">
              <CalendarDays size={16} className="mx-auto mb-1 text-navy" />
              <div className="text-xs text-inksoft">Calendar</div>
            </Link>
            {can("guests") && (
              <Link href="/guests" className="gilded-card maroon-top p-3 text-center hover:-translate-y-0.5 transition-transform">
                <Users size={16} className="mx-auto mb-1 text-maroon" />
                <div className="text-sm font-semibold font-mono text-ink">{stats.guests}</div>
                <div className="text-[10px] text-inksoft">guests</div>
              </Link>
            )}
            {can("budget") && (
              <Link href="/budget" className="gilded-card gold-top p-3 text-center hover:-translate-y-0.5 transition-transform">
                <Wallet size={16} className="mx-auto mb-1 text-gold" />
                <div className="text-xs font-semibold font-mono text-ink">
                  ${Math.round(stats.booked).toLocaleString()}
                </div>
                <div className="text-[10px] text-inksoft">of ${Math.round(stats.projected).toLocaleString()}</div>
              </Link>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {indianDept && <DepartmentCard d={indianDept} big />}
          {otherDepartments.map((d) => (
            <DepartmentCard key={d.slug} d={d} />
          ))}
          {can("prep") && (
            <Link
              href="/prep"
              className="group flex items-center gap-4 rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #FAEEDA 0%, #FFFFFF 70%)",
                border: "1px solid #854F0B33",
                boxShadow: "0 3px 16px rgba(74,27,12,0.07)",
                borderTop: "3px solid #854F0B",
              }}
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "#854F0B" }}>
                <Sparkles size={19} color="#FFFFFF" />
              </div>
              <div className="flex-1 font-display text-base font-semibold" style={{ color: "#633806" }}>
                Wedding prep
              </div>
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" style={{ color: "#854F0B" }} />
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
            <div className="ornament-divider mb-3">
              <span className="line" style={{ background: "linear-gradient(90deg, transparent, #1B3A5C, transparent)" }} />
              <span className="text-xs tracking-wide text-navy font-display italic">Recent activity</span>
              <span className="line" style={{ background: "linear-gradient(90deg, transparent, #1B3A5C, transparent)" }} />
            </div>
            <div className="space-y-1.5">
              {activity.map((a) => (
                <div key={a.id} className="text-xs text-inksoft gilded-card px-3 py-2">
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
