"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { PREP_CATEGORIES } from "@/lib/departments";
import Nav from "@/components/Nav";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function RoutineRow({ routine, isOwner, logs, onToggleToday, onDelete }) {
  const today = logs.find((l) => l.log_date === todayKey() && l.routine_id === routine.id);
  const recent = logs
    .filter((l) => l.routine_id === routine.id)
    .sort((a, b) => (a.log_date < b.log_date ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="flex items-center gap-3 border border-line rounded-lg px-3 py-2 mb-2 bg-white">
      <div className="flex-1">
        <div className="text-sm font-medium text-ink">{routine.title}</div>
        <div className="text-xs text-inksoft">
          {routine.frequency} · last: {recent.map((l) => l.log_date.slice(5)).join(", ") || "no logs yet"}
        </div>
      </div>
      {isOwner ? (
        <>
          <label className="flex items-center gap-1 text-xs text-inksoft">
            <input type="checkbox" checked={!!today} onChange={(e) => onToggleToday(routine.id, e.target.checked)} />
            Today
          </label>
          <button onClick={() => onDelete(routine.id)} className="text-inksoft">
            <Trash2 size={13} />
          </button>
        </>
      ) : (
        <span className="text-xs text-inksoft">{today ? "Done today" : "Not yet today"}</span>
      )}
    </div>
  );
}

export default function PrepPage() {
  const { profile, loading, can } = useAuth();
  const [people, setPeople] = useState([]);
  const [activePerson, setActivePerson] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newRoutine, setNewRoutine] = useState({ category: "hair", title: "", frequency: "Daily" });

  const load = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id,display_name,initials");
    setPeople(profiles || []);
    if (profile) setActivePerson(profile.id);
    const { data: r } = await supabase.from("prep_routines").select("*").eq("active", true);
    setRoutines(r || []);
    const { data: l } = await supabase.from("prep_logs").select("*");
    setLogs(l || []);
  };

  useEffect(() => {
    if (profile && can("prep")) load();
  }, [profile]);

  const addRoutine = async () => {
    if (!newRoutine.title.trim()) return;
    const { data } = await supabase
      .from("prep_routines")
      .insert({ ...newRoutine, user_id: profile.id })
      .select()
      .single();
    if (data) setRoutines([...routines, data]);
    setNewRoutine({ ...newRoutine, title: "" });
  };

  const deleteRoutine = async (id) => {
    setRoutines(routines.filter((r) => r.id !== id));
    await supabase.from("prep_routines").delete().eq("id", id);
  };

  const toggleToday = async (routineId, done) => {
    const key = todayKey();
    const existing = logs.find((l) => l.routine_id === routineId && l.log_date === key);
    if (existing) {
      setLogs(logs.map((l) => (l === existing ? { ...l, done } : l)));
      await supabase.from("prep_logs").update({ done }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("prep_logs")
        .insert({ routine_id: routineId, log_date: key, done })
        .select()
        .single();
      if (data) setLogs([...logs, data]);
    }
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-inksoft">Loading…</div>;
  }
  if (!can("prep")) {
    return (
      <div className="min-h-screen">
        <Nav profile={profile} can={can} />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center text-sm text-inksoft">
          You don't have access to wedding prep.
        </div>
      </div>
    );
  }

  const isOwner = activePerson === profile.id;

  return (
    <div className="min-h-screen">
      <Nav profile={profile} can={can} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="font-display text-2xl font-semibold text-ink mb-4">Wedding prep</div>

        <div className="flex gap-2 mb-6">
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePerson(p.id)}
              className={`text-sm px-3 py-1.5 rounded-lg ${
                activePerson === p.id ? "bg-prep text-white" : "border border-line text-inksoft"
              }`}
            >
              {p.display_name}
            </button>
          ))}
        </div>

        {PREP_CATEGORIES.map((cat) => {
          const catRoutines = routines.filter((r) => r.user_id === activePerson && r.category === cat.slug);
          return (
            <div key={cat.slug} className="mb-5">
              <div className="font-display text-base font-medium text-ink mb-2">{cat.label}</div>
              {catRoutines.map((r) => (
                <RoutineRow
                  key={r.id}
                  routine={r}
                  isOwner={isOwner}
                  logs={logs}
                  onToggleToday={toggleToday}
                  onDelete={deleteRoutine}
                />
              ))}
              {catRoutines.length === 0 && <div className="text-xs text-inksoft mb-2">Nothing added yet.</div>}
              {isOwner && (
                <div className="flex gap-2">
                  <input
                    value={newRoutine.category === cat.slug ? newRoutine.title : ""}
                    onChange={(e) => setNewRoutine({ category: cat.slug, title: e.target.value, frequency: newRoutine.frequency })}
                    onKeyDown={(e) => e.key === "Enter" && addRoutine()}
                    placeholder={`Add a ${cat.label.toLowerCase()} routine`}
                    className="flex-1 text-xs rounded-lg px-2 py-1.5 border border-line"
                  />
                  <select
                    value={newRoutine.category === cat.slug ? newRoutine.frequency : "Daily"}
                    onChange={(e) => setNewRoutine({ category: cat.slug, title: newRoutine.title, frequency: e.target.value })}
                    className="text-xs rounded-lg px-1.5 border border-line"
                  >
                    <option>Daily</option>
                    <option>Every 3 days</option>
                    <option>Weekly</option>
                    <option>As needed</option>
                  </select>
                  <button
                    onClick={() => {
                      setNewRoutine({ ...newRoutine, category: cat.slug });
                      addRoutine();
                    }}
                    className="text-xs px-2.5 rounded-lg border border-line"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
