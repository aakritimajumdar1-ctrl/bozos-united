import { Flower2, Bell, Scale, PartyPopper, Plane } from "lucide-react";

// textClass / softBg / borderClass are written as full literal strings (not built with
// template interpolation) so Tailwind's JIT scanner can find and generate them.
export const DEPARTMENTS = {
  indian: {
    slug: "indian",
    label: "Indian wedding",
    Icon: Flower2,
    textClass: "text-indian-accent",
    softBg: "bg-indian-soft",
  },
  american: {
    slug: "american",
    label: "American wedding",
    Icon: Bell,
    textClass: "text-american",
    softBg: "bg-american-soft",
  },
  court: {
    slug: "court",
    label: "Court wedding",
    Icon: Scale,
    textClass: "text-court",
    softBg: "bg-court-soft",
  },
  bachelor: {
    slug: "bachelor",
    label: "Bachelor and bachelorette",
    Icon: PartyPopper,
    textClass: "text-bachelor",
    softBg: "bg-bachelor-soft",
  },
  honeymoon: {
    slug: "honeymoon",
    label: "Honeymoon",
    Icon: Plane,
    textClass: "text-honeymoon",
    softBg: "bg-honeymoon-soft",
  },
};

export const DEPARTMENT_LIST = Object.values(DEPARTMENTS);

export const ALL_PERMISSIONS = [
  "admin",
  "indian",
  "american",
  "court",
  "bachelor",
  "honeymoon",
  "prep",
  "guests",
  "budget",
];

export const PREP_CATEGORIES = [
  { slug: "hair", label: "Hair care" },
  { slug: "facial_skincare", label: "Facial skincare" },
  { slug: "body_skincare", label: "Body skincare" },
  { slug: "gut_health", label: "Gut health" },
  { slug: "diet", label: "Diet" },
  { slug: "exercise", label: "Exercise" },
];
