import {
  Banknote,
  Briefcase,
  Car,
  CircleEllipsis,
  CirclePlus,
  Clapperboard,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  PiggyBank,
  Receipt,
  ShoppingBag,
  Smartphone,
  Tag,
  Utensils,
  Wallet,
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
  "piggy-bank": PiggyBank,
  "circle-plus": CirclePlus,
  tag: Tag,
  wallet: Wallet,
  landmark: Landmark,
  banknote: Banknote,
  smartphone: Smartphone,
  "credit-card": CreditCard,
};

export const ICON_OPTIONS = Object.keys(ICONS);

export function AppIcon({ name, className }: { name?: string | null | undefined; className?: string | undefined }) {
  const Cmp = ICONS[name ?? "tag"] ?? Tag;
  return <Cmp className={className} />;
}