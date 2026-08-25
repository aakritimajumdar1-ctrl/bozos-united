import {
  Church,
  PartyPopper,
  Sun,
  Flower2,
  Music,
  Plane,
  Scale,
  Users,
  CalendarDays,
  MapPin,
  Briefcase,
  Shirt,
  UtensilsCrossed,
  Sparkles,
  Circle,
} from "lucide-react";

// Picks a fitting icon for an event based on its name, so ceremonies, receptions,
// haldi, sangeet, etc. are visually distinct at a glance, without needing a manual
// icon-picker field.
export function eventIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("ceremony") || n.includes("courthouse")) return Church;
  if (n.includes("reception")) return PartyPopper;
  if (n.includes("haldi")) return Sun;
  if (n.includes("mehendi") || n.includes("mehndi") || n.includes("henna")) return Flower2;
  if (n.includes("sangeet")) return Music;
  if (n.includes("aiburobhat")) return UtensilsCrossed;
  if (n.includes("rehearsal")) return Users;
  if (n.includes("bachelorette") || n.includes("bachelor")) return PartyPopper;
  if (n.includes("honeymoon") || n.includes("trip")) return Plane;
  if (n.includes("court")) return Scale;
  return CalendarDays;
}

export const ITEM_TYPE_META = {
  venue: { label: "Venue", Icon: MapPin, hex: "#B8860B", soft: "#FBF2DC" },
  vendor: { label: "Vendor", Icon: Briefcase, hex: "#4C6B8A", soft: "#E7EEF4" },
  attire: { label: "Attire", Icon: Shirt, hex: "#A65B7A", soft: "#F8EAF0" },
  food: { label: "Food", Icon: UtensilsCrossed, hex: "#5B8A5A", soft: "#EAF3E9" },
  performance: { label: "Performance", Icon: Music, hex: "#7A5BA6", soft: "#F0EAF8" },
  other: { label: "Other", Icon: Circle, hex: "#8A8478", soft: "#F1EFEA" },
};

export { Sparkles };
