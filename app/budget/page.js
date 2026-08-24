"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { DEPARTMENTS, DEPARTMENT_LIST } from "@/lib/departments";
import Nav from "@/components/Nav";

function money(n) {
  return "$" + Math.round(Number(n) || 0).toLocaleString();
}

export default function BudgetPage() {
  const { profile, loading, can } = useAuth();
  const [items, setItems] = useState([]); // event_items joined with event.department
  const [extras, setExtras] = useState([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [newExtra, setNewExtra] = useState({ department: "indian", label: "" });

  const load = async () => {
    const { data: events } = await supabase.from("events").select("id,department,name");
    const eventMap = Object.fromEntries((events || []).map((e) => [e.id, e]));
    const { data: itemData } = await supabase.from("event_items").select("*");
    const enriched = (itemData || []).map((i) => ({ ...i, department: eventMap[i.event_id]?.department, eventName: eventMap[i.event_id]?.name }));
    setItems(enriched);
    const { data: extraData } = await supabase.from("budget_extra").select("*").order("created_at");
    setExtras(extraData || []);
  };

  useEffect(() => {
    if (profile && can("budget")) load();
  }, [profile]);

  const addExtra = async () => {
    if (!newExtra.label.trim()) return;
    const { data } = await supabase.from("budget_extra").insert(newExtra).select().single();
    if (data) setExtras([...extras, data]);
    setNewExtra({ ...newExtra, label: "" });
  };

  const updateExtra = async (id, patch) => {
    setExtras(extras.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    await supabase.from("budget_extra").update(patch).eq("id", id);
  };

  const deleteExtra = async (id) => {
    setExtras(extras.filter((e) => e.id !== id));
    await supabase.from("budget_extra").delete().eq("id", id);
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-inksoft">Loading…</div>;
  }
  if (!can("budget")) {
    return (
      <div className="min-h-screen">
        <Nav profile={profile} can={can} />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center text-sm text-inksoft">
          You don't have access to the budget.
        </div>
      </div>
    );
  }

  const rows = DEPARTMENT_LIST.map((d) => {
    const deptItems = items.filter((i) => i.department === d.slug);
    const deptExtras = extras.filter((e) => e.department === d.slug);
    const projected =
      deptItems.reduce((s, i) => {
        if (i.status === "booked") return s + (Number(i.cost) || 0);
        if (i.status === "considering" && i.is_lead_option) return s + (Number(i.cost) || 0);
        return s;
      }, 0) + deptExtras.reduce((s, e) => s + (Number(e.projected_cost) || 0), 0);
    const booked =
      deptItems.reduce((s, i) => (i.status === "booked" ? s + (Number(i.cost) || 0) : s), 0) +
      deptExtras.reduce((s, e) => s + (Number(e.actual_cost) || 0), 0);
    return { dept: d, projected, booked };
  });

  const grandProjected = rows.reduce((s, r) => s + r.projected, 0);
  const grandBooked = rows.reduce((s, r) => s + r.booked, 0);

  const visibleExtras = extras.filter((e) => deptFilter === "all" || e.department === deptFilter);
  const visibleItems = items.filter((i) => (deptFilter === "all" || i.department === deptFilter) && i.cost);

  return (
    <div className="min-h-screen">
      <Nav profile={profile} can={can} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="font-display text-2xl font-semibold text-ink mb-4">Budget</div>

        <div className="bg-card border border-line rounded-xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-2 text-sm font-medium text-inksoft border-b border-line pb-2 mb-2">
            <span>Department</span>
            <span className="text-right">Projected</span>
            <span className="text-right">Booked</span>
          </div>
          {rows.map((r) => (
            <div key={r.dept.slug} className="grid grid-cols-3 gap-2 text-sm py-1.5">
              <span className={r.dept.textClass}>{r.dept.label}</span>
              <span className="text-right font-mono">{money(r.projected)}</span>
              <span className="text-right font-mono">{money(r.booked)}</span>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2 text-sm font-semibold pt-2 mt-2 border-t border-line">
            <span>Total</span>
            <span className="text-right font-mono">{money(grandProjected)}</span>
            <span className="text-right font-mono">{money(grandBooked)}</span>
          </div>
        </div>

        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="text-xs rounded-lg px-2 py-1.5 border border-line mb-3">
          <option value="all">All departments</option>
          {DEPARTMENT_LIST.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.label}
            </option>
          ))}
        </select>

        <div className="font-display text-base font-medium text-ink mb-2">Line items from events</div>
        <div className="space-y-1.5 mb-6">
          {visibleItems.map((i) => (
            <div key={i.id} className="flex justify-between text-sm bg-card border border-line rounded-lg px-3 py-2">
              <span>
                {i.name} <span className="text-inksoft text-xs">· {i.eventName}</span>
              </span>
              <span className="font-mono">
                {money(i.cost)} <span className="text-xs text-inksoft">({i.status})</span>
              </span>
            </div>
          ))}
          {visibleItems.length === 0 && <div className="text-sm text-inksoft">No costed items yet.</div>}
        </div>

        <div className="font-display text-base font-medium text-ink mb-2">Other budget lines</div>
        <div className="space-y-1.5 mb-4">
          {visibleExtras.map((e) => (
            <div key={e.id} className="flex items-center gap-2 bg-card border border-line rounded-lg px-3 py-2">
              <input
                value={e.label}
                onChange={(ev) => updateExtra(e.id, { label: ev.target.value })}
                className="flex-1 text-sm bg-transparent outline-none"
              />
              <input
                type="number"
                value={e.projected_cost}
                onChange={(ev) => updateExtra(e.id, { projected_cost: ev.target.value })}
                className="w-20 text-xs font-mono border border-line rounded px-1 py-0.5"
                placeholder="Projected"
              />
              <input
                type="number"
                value={e.actual_cost}
                onChange={(ev) => updateExtra(e.id, { actual_cost: ev.target.value })}
                className="w-20 text-xs font-mono border border-line rounded px-1 py-0.5"
                placeholder="Actual"
              />
              <button onClick={() => deleteExtra(e.id)} className="text-inksoft">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 max-w-lg">
          <select
            value={newExtra.department}
            onChange={(e) => setNewExtra({ ...newExtra, department: e.target.value })}
            className="text-xs rounded-lg px-2 border border-line"
          >
            {DEPARTMENT_LIST.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label}
              </option>
            ))}
          </select>
          <input
            value={newExtra.label}
            onChange={(e) => setNewExtra({ ...newExtra, label: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addExtra()}
            placeholder="e.g. Wedding planner retainer"
            className="flex-1 text-sm rounded-lg px-3 py-2 border border-line"
          />
          <button onClick={addExtra} className="text-sm px-4 rounded-lg text-white bg-ink">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
