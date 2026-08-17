import {
  Activity,
  Banknote,
  Briefcase,
  Car,
  CircleEllipsis,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  PartyPopper,
  Plane,
  Receipt,
  ShoppingBag,
  Trophy,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  "shopping-bag": ShoppingBag,
  receipt: Receipt,
  clapperboard: Clapperboard,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  "circle-ellipsis": CircleEllipsis,
  briefcase: Briefcase,
  laptop: Laptop,
  "piggy-bank": Trophy,
  tag: Receipt,
  landmark: Landmark,
  banknote: Banknote,
  flight: Plane,
  outing: PartyPopper,
  sports: Trophy,
  activities: Activity,
};

export const ICON_OPTIONS = Object.keys(ICONS);

export function AppIcon({ name, className }: { name?: string | null | undefined; className?: string | undefined }) {
  const Cmp = ICONS[name ?? "tag"] ?? Receipt;
  return <Cmp className={className} />;
}
