"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabaseClient";
import Nav from "@/components/Nav";

export default function GuestsPage() {
  const { profile, loading, can } = useAuth();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [invites, setInvites] = useState([]); // {guest_id, event_id, rsvp_status}
  const [newName, setNewName] = useState("");
  const [sideFilter, setSideFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  const load = async () => {
    const [{ data: g }, { data: e }, { data: inv }] = await Promise.all([
      supabase.from("guests").select("*").order("name"),
      supabase.from("events").select("*").order("department").order("sort_order"),
      supabase.from("guest_invites").select("*"),
    ]);
    setGuests(g || []);
    setEvents(e || []);
    setInvites(inv || []);
  };

  useEffect(() => {
    if (profile && can("guests")) load();
  }, [profile]);

  const addGuest = async () => {
    if (!newName.trim()) return;
    const { data } = await supabase.from("guests").insert({ name: newName.trim() }).select().single();
    if (data) setGuests([...guests, data]);
    setNewName("");
  };

  const updateGuest = async (id, patch) => {
    setGuests(guests.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    await supabase.from("guests").update(patch).eq("id", id);
  };

  const deleteGuest = async (id) => {
    setGuests(guests.filter((g) => g.id !== id));
    await supabase.from("guests").delete().eq("id", id);
  };

  const toggleInvite = async (guestId, eventId) => {
    const existing = invites.find((i) => i.guest_id === guestId && i.event_id === eventId);
    if (existing) {
      setInvites(invites.filter((i) => i !== existing));
      await supabase.from("guest_invites").delete().eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("guest_invites")
        .insert({ guest_id: guestId, event_id: eventId })
        .select()
        .single();
      if (data) setInvites([...invites, data]);
    }
  };

  const setRsvp = async (guestId, eventId, status) => {
    const existing = invites.find((i) => i.guest_id === guestId && i.event_id === eventId);
    if (!existing) return;
    setInvites(invites.map((i) => (i === existing ? { ...i, rsvp_status: status } : i)));
    await supabase.from("guest_invites").update({ rsvp_status: status }).eq("id", existing.id);
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-inksoft">Loading…</div>;
  }
  if (!can("guests")) {
    return (
      <div className="min-h-screen">
        <Nav profile={profile} can={can} />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center text-sm text-inksoft">
          You don't have access to the guest list.
        </div>
      </div>
    );
  }

  const filteredGuests = guests.filter((g) => {
    if (sideFilter !== "all" && g.side !== sideFilter) return false;
    if (eventFilter !== "all") {
      const hasInvite = invites.some((i) => i.guest_id === g.id && i.event_id === eventFilter);
      if (!hasInvite) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen">
      <Nav profile={profile} can={can} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="font-display text-2xl font-semibold text-ink mb-4">Guest list</div>

        <div className="flex flex-wrap gap-2 mb-4">
          <select value={sideFilter} onChange={(e) => setSideFilter(e.target.value)} className="text-xs rounded-lg px-2 py-1.5 border border-line">
            <option value="all">All sides</option>
            <option value="Aakriti">Aakriti's side</option>
            <option value="Riley">Riley's side</option>
            <option value="Shared">Shared</option>
          </select>
          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="text-xs rounded-lg px-2 py-1.5 border border-line">
            <option value="all">All events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} ({ev.department})
              </option>
            ))}
          </select>
          <span className="text-xs text-inksoft self-center">{filteredGuests.length} guests</span>
        </div>

        <div className="overflow-x-auto border border-line rounded-xl bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-inksoft">
                <th className="p-2">Name</th>
                <th className="p-2">Side</th>
                <th className="p-2">Contact</th>
                <th className="p-2">Plus one</th>
                {events.map((ev) => (
                  <th key={ev.id} className="p-2 whitespace-nowrap">
                    {ev.name}
                  </th>
                ))}
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((g) => (
                <tr key={g.id} className="border-b border-line last:border-b-0">
                  <td className="p-2">
                    <input
                      value={g.name}
                      onChange={(e) => updateGuest(g.id, { name: e.target.value })}
                      className="text-sm bg-transparent outline-none w-32"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={g.side || ""}
                      onChange={(e) => updateGuest(g.id, { side: e.target.value })}
                      className="text-xs rounded-md border border-line px-1 py-0.5"
                    >
                      <option value="">—</option>
                      <option value="Aakriti">Aakriti</option>
                      <option value="Riley">Riley</option>
                      <option value="Shared">Shared</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      value={g.contact || ""}
                      onChange={(e) => updateGuest(g.id, { contact: e.target.value })}
                      placeholder="email or phone"
                      className="text-xs bg-transparent outline-none w-28"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={g.plus_one}
                      onChange={(e) => updateGuest(g.id, { plus_one: e.target.checked })}
                    />
                  </td>
                  {events.map((ev) => {
                    const invite = invites.find((i) => i.guest_id === g.id && i.event_id === ev.id);
                    return (
                      <td key={ev.id} className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={!!invite}
                          onChange={() => toggleInvite(g.id, ev.id)}
                        />
                        {invite && (
                          <select
                            value={invite.rsvp_status}
                            onChange={(e) => setRsvp(g.id, ev.id, e.target.value)}
                            className="text-[10px] block mt-1 rounded border border-line"
                          >
                            <option value="pending">Pending</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2">
                    <button onClick={() => deleteGuest(g.id)} className="text-inksoft">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 mt-4 max-w-sm">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGuest()}
            placeholder="Add a guest by name"
            className="flex-1 text-sm rounded-lg px-3 py-2 border border-line"
          />
          <button onClick={addGuest} className="text-sm px-4 rounded-lg text-white bg-ink">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
