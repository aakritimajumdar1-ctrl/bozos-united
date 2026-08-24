"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { DEPARTMENT_LIST } from "@/lib/departments";
import Nav from "@/components/Nav";

const DOT_COLORS = {
  indian: "#993C1D",
  american: "#185FA5",
  court: "#534AB7",
  bachelor: "#993556",
  honeymoon: "#0F6E56",
  general: "#6B6070",
};

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}
function todayKey() {
  return dateKey(new Date());
}
function prettyDate(key) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function CalendarPage() {
  const { profile, loading, can } = useAuth();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [customEntries, setCustomEntries] = useState([]);
  const [eventEntries, setEventEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({ title: "", department: "" });

  const load = async () => {
    const { data: custom } = await supabase.from("calendar_events").select("*").order("entry_date");
    setCustomEntries(custom || []);
    const { data: events } = await supabase.from("events").select("id,name,department,event_date").not("event_date", "is", null);
    setEventEntries(events || []);
  };

  useEffect(() => {
    if (profile) load();
  }, [profile]);

  const addEntry = async () => {
    if (!newEntry.title.trim()) return;
    const payload = {
      title: newEntry.title.trim(),
      entry_date: selectedDate,
      department: newEntry.department || null,
      created_by: profile.id,
    };
    const { data } = await supabase.from("calendar_events").insert(payload).select().single();
    if (data) setCustomEntries([...customEntries, data]);
    setNewEntry({ title: "", department: "" });
  };

  const deleteEntry = async (id) => {
    setCustomEntries(customEntries.filter((e) => e.id !== id));
    await supabase.from("calendar_events").delete().eq("id", id);
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-inksoft">Loading…</div>;
  }

  // Merge both sources into one lookup: dateKey -> [{title, color, source}]
  const allEntries = {};
  customEntries.forEach((e) => {
    const list = (allEntries[e.entry_date] ||= []);
    list.push({ id: e.id, title: e.title, color: DOT_COLORS[e.department] || DOT_COLORS.general, source: "custom", raw: e });
  });
  eventEntries.forEach((e) => {
    const list = (allEntries[e.event_date] ||= []);
    list.push({ id: e.id, title: e.name, color: DOT_COLORS[e.department] || DOT_COLORS.general, source: "event" });
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const selectedEntries = allEntries[selectedDate] || [];
  const editableDepartments = DEPARTMENT_LIST.filter((d) => can(d.slug));

  return (
    <div className="min-h-screen">
      <Nav profile={profile} can={can} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="font-display text-2xl font-semibold text-ink mb-4">Calendar</div>

        <div className="bg-card border border-line rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="text-inksoft">
              <ChevronLeft size={18} />
            </button>
            <div className="font-display text-base font-medium text-ink">{monthLabel}</div>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="text-inksoft">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-inksoft mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const key = dateKey(new Date(year, month, day));
              const dayEntries = allEntries[key] || [];
              const isSelected = key === selectedDate;
              const isToday = key === todayKey();
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(key)}
                  className={`aspect-square rounded-lg text-xs flex flex-col items-center justify-center gap-0.5 ${
                    isSelected ? "bg-ink text-cream" : isToday ? "border border-ink text-ink" : "text-ink hover:bg-line/40"
                  }`}
                >
                  <span>{day}</span>
                  <span className="flex gap-0.5">
                    {dayEntries.slice(0, 3).map((e, idx) => (
                      <span
                        key={idx}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: isSelected ? "#FAF5EC" : e.color }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="font-display text-base font-medium text-ink mb-2">{prettyDate(selectedDate)}</div>
        <div className="space-y-1.5 mb-4">
          {selectedEntries.length === 0 && <div className="text-sm text-inksoft">Nothing on the calendar this day.</div>}
          {selectedEntries.map((e) => (
            <div key={e.id + e.source} className="flex items-center gap-2 bg-card border border-line rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
              <span className="text-sm flex-1 text-ink">{e.title}</span>
              {e.source === "event" ? (
                <span className="text-xs text-inksoft">from department page</span>
              ) : (
                <button onClick={() => deleteEntry(e.id)} className="text-inksoft">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={newEntry.department}
            onChange={(e) => setNewEntry({ ...newEntry, department: e.target.value })}
            className="text-xs rounded-lg px-2 border border-line"
          >
            <option value="">General</option>
            {editableDepartments.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label}
              </option>
            ))}
          </select>
          <input
            value={newEntry.title}
            onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addEntry()}
            placeholder={`Add something for ${prettyDate(selectedDate)}`}
            className="flex-1 text-sm rounded-lg px-3 py-2 border border-line"
          />
          <button onClick={addEntry} className="text-sm px-4 rounded-lg text-white bg-ink">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
