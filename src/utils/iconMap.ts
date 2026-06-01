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
  Building2,
  Code,
  GraduationCap,
  Smartphone,
  Target,
  Wallet,
  TrendingUp,
  Receipt,
  BarChart3,
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
  Building2: Building2,
  Code: Code,
  GraduationCap: GraduationCap,
  Smartphone: Smartphone,
  Target: Target,
  Wallet: Wallet,
  TrendingUp: TrendingUp,
  Receipt: Receipt,
  BarChart3: BarChart3,
  MoreHorizontal: MoreHorizontal,
};

export const getIcon = (iconName?: string): LucideIcon => {
  if (!iconName) return MoreHorizontal;
  return ICON_MAP[iconName] || HelpCircle;
};
