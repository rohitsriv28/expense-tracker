import {
  Coffee,
  Utensils,
  Car,
  Plane,
  ShoppingBag,
  Gift,
  Home,
  Wifi,
  Gamepad2,
  Music,
  Heart,
  Briefcase,
  GraduationCap,
  Smartphone,
  MoreHorizontal,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Coffee: Coffee,
  Utensils: Utensils,
  Car: Car,
  Plane: Plane,
  ShoppingBag: ShoppingBag,
  Gift: Gift,
  Home: Home,
  Wifi: Wifi,
  Gamepad2: Gamepad2,
  Music: Music,
  Heart: Heart,
  Briefcase: Briefcase,
  GraduationCap: GraduationCap,
  Smartphone: Smartphone,
  MoreHorizontal: MoreHorizontal,
};

export const getIcon = (iconName?: string): LucideIcon => {
  if (!iconName) return MoreHorizontal;
  return ICON_MAP[iconName] || HelpCircle;
};
