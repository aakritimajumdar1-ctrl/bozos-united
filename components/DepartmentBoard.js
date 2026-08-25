"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Star, Upload } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const ITEM_TYPES = [
  { value: "venue", label: "Venue" },
  { value: "vendor", label: "Vendor" },
  { value: "attire", label: "Attire" },
  { value: "food", label: "Food" },
  { value: "performance", label: "Performance" },
  { value: "other", label: "Other" },
];

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
    <div className="border border-line rounded-lg p-3 mb-2 bg-white">
      <div className="flex items-start gap-2 mb-2">
        <select
          value={item.item_type}
          onChange={(e) => onUpdate({ item_type: e.target.value })}
          className="text-xs rounded-md px-1.5 py-1 border border-line"
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
          className="flex-1 text-sm font-medium bg-transparent outline-none"
        />
        <button onClick={onDelete} aria-label="Delete item" className="text-inksoft">
          <Trash2 size={14} />
        </button>
      </div>

      {item.item_type === "attire" && (
        <div className="mb-2">
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

      <div className="grid grid-cols-2 gap-2 mb-2">
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

      <div className="flex items-center gap-2">
        <select
          value={item.status}
          onChange={(e) => onUpdate({ status: e.target.value })}
          className="text-xs rounded-md px-1.5 py-1 border border-line"
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
        className="w-full text-xs rounded-md px-2 py-1.5 border border-line resize-none mt-2"
      />
    </div>
  );
}

function EventCard({ event, department, theme, guestCount }) {
  const [items, setItems] = useState([]);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [notes, setNotes] = useState(event.notes || "");

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
    const shouldAutoLead = competingConsidering.length === 0; // first option of its kind counts automatically
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
    <div className="bg-card border border-line rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display text-lg font-semibold text-ink">{event.name}</div>
        <Link href={`/guests?event=${event.id}`} className="text-xs text-inksoft underline">
          {guestCount} invited
        </Link>
      </div>

      <div className="flex gap-4 text-xs text-inksoft mb-3 font-mono">
        <span>Projected {money(projected)}</span>
        <span>Booked {money(booked)}</span>
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
        className={`w-full text-xs py-2 rounded-lg border border-dashed mb-3 ${theme.textClass} border-current`}
      >
        <Plus size={12} className="inline -mt-0.5 mr-1" />
        Add venue, vendor, attire, food, or performance
      </button>

      <div className="border-t border-line pt-2 mb-2">
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
        className="w-full text-sm rounded-md px-2 py-1.5 border border-line resize-none"
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
      {events.map((ev) => (
        <EventCard key={ev.id} event={ev} department={department} theme={theme} guestCount={guestCounts[ev.id] || 0} />
      ))}
      <div className="flex gap-2">
        <input
          value={newEventName}
          onChange={(e) => setNewEventName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addEvent()}
          placeholder="Add a new event for this wedding"
          className="flex-1 text-sm rounded-lg px-3 py-2 border border-line"
        />
        <button onClick={addEvent} className={`text-sm px-4 rounded-lg text-white bg-ink`}>
          Add
        </button>
      </div>
    </div>
  );
}
