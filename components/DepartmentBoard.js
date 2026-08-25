"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Star, Upload, Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { eventIcon, ITEM_TYPE_META } from "@/lib/visualMeta";

const ITEM_TYPES = Object.entries(ITEM_TYPE_META).map(([value, meta]) => ({ value, label: meta.label }));

function money(n) {
  return "$" + (Number(n) || 0).toLocaleString();
}

async function uploadAttireImage(file) {
  const path = `${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("attire").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("attire").getPublicUrl(path);
  return data.publicUrl;
}

function ItemRow({ item, accentClass, onUpdate, onDelete }) {
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const meta = ITEM_TYPE_META[item.item_type] || ITEM_TYPE_META.other;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAttireImage(file);
      onUpdate({ image_url: url });
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
    setUploading(false);
  };

  return (
    <div
      className="rounded-lg p-3 mb-2 bg-white shadow-sm"
      style={{ borderLeft: `4px solid ${meta.hex}`, border: "1px solid #E9E0D2", borderLeftWidth: "4px", borderLeftColor: meta.hex }}
    >
      <div className="flex items-start gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: meta.soft }}
        >
          <meta.Icon size={13} style={{ color: meta.hex }} />
        </div>
        <select
          value={item.item_type}
          onChange={(e) => onUpdate({ item_type: e.target.value })}
          className="text-xs rounded-md px-1.5 py-1 border-none font-medium"
          style={{ backgroundColor: meta.soft, color: meta.hex }}
        >
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          value={item.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Name"
          className="flex-1 text-sm font-medium bg-transparent outline-none mt-1"
        />
        <button onClick={onDelete} aria-label="Delete item" className="text-inksoft mt-1.5">
          <Trash2 size={14} />
        </button>
      </div>

      {item.item_type === "attire" && (
        <div className="mb-2 ml-8">
          <input
            value={item.person || ""}
            onChange={(e) => onUpdate({ person: e.target.value })}
            placeholder="Who's wearing this"
            className="text-xs rounded-md px-2 py-1 border border-line w-full mb-2"
          />
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt={item.name} className="w-full max-h-56 object-cover rounded-md mb-2" />
          )}
          <label className="inline-flex items-center gap-1 text-xs text-inksoft cursor-pointer">
            <Upload size={13} /> {uploading ? "Uploading…" : "Upload photo"}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-2 ml-8">
        <input
          value={item.link || ""}
          onChange={(e) => onUpdate({ link: e.target.value })}
          placeholder="Link"
          className="text-xs rounded-md px-2 py-1 border border-line"
        />
        <input
          type="number"
          value={item.cost ?? ""}
          onChange={(e) => onUpdate({ cost: e.target.value === "" ? null : e.target.value })}
          placeholder="Cost"
          className="text-xs rounded-md px-2 py-1 border border-line font-mono"
        />
      </div>

      <div className="flex items-center gap-2 ml-8">
        <select
          value={item.status}
          onChange={(e) => onUpdate({ status: e.target.value })}
          className={`text-xs rounded-md px-1.5 py-1 border ${
            item.status === "booked" ? "border-honeymoon text-honeymoon bg-honeymoon-soft" : "border-line text-inksoft"
          }`}
        >
          <option value="considering">Considering</option>
          <option value="booked">Booked</option>
        </select>
        {item.status === "considering" && (
          <button
            onClick={() => onUpdate({ is_lead_option: !item.is_lead_option })}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md border ${
              item.is_lead_option ? `${accentClass} border-current` : "text-inksoft border-line"
            }`}
          >
            <Star size={12} fill={item.is_lead_option ? "currentColor" : "none"} />
            {item.is_lead_option ? "Top pick" : "Mark as top pick"}
          </button>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => onUpdate({ notes })}
        placeholder="Notes — measurements, contact person, what you liked, anything..."
        rows={2}
        className="w-full text-xs rounded-md px-2 py-1.5 border border-line resize-none mt-2 ml-8"
        style={{ width: "calc(100% - 2rem)" }}
      />
    </div>
  );
}

function EventCard({ event, theme, guestCount, tint }) {
  const [items, setItems] = useState([]);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [notes, setNotes] = useState(event.notes || "");
  const EventIcon = eventIcon(event.name);

  const load = async () => {
    const { data: itemData } = await supabase
      .from("event_items")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at");
    setItems(itemData || []);
    const { data: todoData } = await supabase
      .from("todos")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at");
    setTodos(todoData || []);
  };

  useEffect(() => {
    load();
  }, [event.id]);

  const addItem = async () => {
    const defaultType = "venue";
    const competingConsidering = items.filter(
      (i) => i.item_type === defaultType && i.status === "considering"
    );
    const shouldAutoLead = competingConsidering.length === 0;
    const { data } = await supabase
      .from("event_items")
      .insert({
        event_id: event.id,
        item_type: defaultType,
        name: "New item",
        status: "considering",
        is_lead_option: shouldAutoLead,
      })
      .select()
      .single();
    if (data) setItems([...items, data]);
  };

  const updateItem = async (id, patch) => {
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    await supabase.from("event_items").update(patch).eq("id", id);
  };

  const deleteItem = async (id) => {
    setItems(items.filter((i) => i.id !== id));
    await supabase.from("event_items").delete().eq("id", id);
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    const { data } = await supabase
      .from("todos")
      .insert({ event_id: event.id, text: newTodo.trim() })
      .select()
      .single();
    if (data) setTodos([...todos, data]);
    setNewTodo("");
  };

  const toggleTodo = async (id, done) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done } : t)));
    await supabase.from("todos").update({ done }).eq("id", id);
  };

  const deleteTodo = async (id) => {
    setTodos(todos.filter((t) => t.id !== id));
    await supabase.from("todos").delete().eq("id", id);
  };

  const saveNotes = async () => {
    await supabase.from("events").update({ notes }).eq("id", event.id);
  };

  const projected = items.reduce((s, i) => {
    if (i.status === "booked") return s + (Number(i.cost) || 0);
    if (i.status === "considering" && i.is_lead_option) return s + (Number(i.cost) || 0);
    return s;
  }, 0);
  const booked = items.reduce((s, i) => (i.status === "booked" ? s + (Number(i.cost) || 0) : s), 0);

  return (
    <div
      className="rounded-2xl p-4 mb-5"
      style={{
        background: tint ? `linear-gradient(160deg, ${theme.softHex} 0%, #FFFFFF 55%)` : "#FFFFFF",
        border: `1px solid ${theme.hex}2a`,
        borderTop: `3px solid ${theme.hex}`,
        boxShadow: "0 3px 16px rgba(74,27,12,0.06)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.hex }}>
          <EventIcon size={16} color="#FFFFFF" />
        </div>
        <div className="font-display text-lg font-semibold flex-1" style={{ color: theme.deepHex }}>
          {event.name}
        </div>
        <Link
          href={`/guests?event=${event.id}`}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: theme.softHex, color: theme.hex }}
        >
          <Users size={11} /> {guestCount}
        </Link>
      </div>

      <div className="flex gap-2 text-xs mb-3 font-mono">
        <span className="px-2 py-1 rounded-full bg-honeymoon-soft text-honeymoon">Booked {money(booked)}</span>
        <span className="px-2 py-1 rounded-full" style={{ backgroundColor: theme.softHex, color: theme.hex }}>
          Projected {money(projected)}
        </span>
      </div>

      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          accentClass={theme.textClass}
          onUpdate={(patch) => updateItem(item.id, patch)}
          onDelete={() => deleteItem(item.id)}
        />
      ))}
      <button
        onClick={addItem}
        className="w-full text-xs py-2 rounded-lg border border-dashed mb-3"
        style={{ borderColor: theme.hex, color: theme.hex }}
      >
        <Plus size={12} className="inline -mt-0.5 mr-1" />
        Add venue, vendor, attire, food, or performance
      </button>

      <div className="border-t pt-2 mb-2" style={{ borderColor: `${theme.hex}22` }}>
        {todos.map((t) => (
          <div key={t.id} className="flex items-center gap-2 py-1">
            <input type="checkbox" checked={t.done} onChange={(e) => toggleTodo(t.id, e.target.checked)} />
            <span className={`text-sm flex-1 ${t.done ? "line-through text-inksoft" : "text-ink"}`}>{t.text}</span>
            <button onClick={() => deleteTodo(t.id)} className="text-inksoft">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <div className="flex gap-2 mt-1">
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="Add a to-do"
            className="flex-1 text-xs rounded-md px-2 py-1.5 border border-line"
          />
          <button onClick={addTodo} className="text-xs px-2.5 rounded-md border border-line">
            Add
          </button>
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={saveNotes}
        placeholder="Notes for this event..."
        rows={2}
        className="w-full text-sm rounded-md px-2 py-1.5 border border-line resize-none bg-white/70"
      />
    </div>
  );
}

export default function DepartmentBoard({ department, theme }) {
  const [events, setEvents] = useState([]);
  const [guestCounts, setGuestCounts] = useState({});
  const [newEventName, setNewEventName] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("department", department)
      .order("sort_order");
    setEvents(data || []);

    if (data?.length) {
      const { data: invites } = await supabase
        .from("guest_invites")
        .select("event_id")
        .in("event_id", data.map((e) => e.id));
      const counts = {};
      (invites || []).forEach((i) => {
        counts[i.event_id] = (counts[i.event_id] || 0) + 1;
      });
      setGuestCounts(counts);
    }
  };

  useEffect(() => {
    load();
  }, [department]);

  const addEvent = async () => {
    if (!newEventName.trim()) return;
    const { data } = await supabase
      .from("events")
      .insert({ department, name: newEventName.trim(), sort_order: events.length })
      .select()
      .single();
    if (data) setEvents([...events, data]);
    setNewEventName("");
  };

  return (
    <div>
      {events.map((ev, idx) => (
        <EventCard
          key={ev.id}
          event={ev}
          theme={theme}
          guestCount={guestCounts[ev.id] || 0}
          tint={idx % 2 === 1}
        />
      ))}
      <div className="flex gap-2">
        <input
          value={newEventName}
          onChange={(e) => setNewEventName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addEvent()}
          placeholder="Add a new event for this wedding"
          className="flex-1 text-sm rounded-lg px-3 py-2 border border-line"
        />
        <button onClick={addEvent} className="text-sm px-4 rounded-lg text-white" style={{ backgroundColor: theme.hex }}>
          Add
        </button>
      </div>
    </div>
  );
}
