import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  BellDot,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  Flame,
  Folders,
  GraduationCap,
  GripVertical,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  Users,
  Video,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "../cn";

export const ICONS = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "award": Award,
  "bell": Bell,
  "bell-dot": BellDot,
  "book": BookOpen,
  "branch": Building2,
  "calendar": Calendar,
  "chart": BarChart3,
  "check": Check,
  "check-circle": CheckCircle2,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "clip": ClipboardList,
  "clock": Clock,
  "comment": MessageCircle,
  "course": GraduationCap,
  "dashboard": LayoutDashboard,
  "download": Download,
  "drag": GripVertical,
  "edit": Pencil,
  "error": XCircle,
  "exam": FileCheck2,
  "external": ExternalLink,
  "eye": Eye,
  "eye-off": EyeOff,
  "filter": SlidersHorizontal,
  "flame": Flame,
  "heart": Heart,
  "home": Home,
  "info": Info,
  "lesson": Video,
  "lock": Lock,
  "logout": LogOut,
  "menu": Menu,
  "more": MoreHorizontal,
  "paperclip": Paperclip,
  "pause": Pause,
  "people": Users,
  "play": Play,
  "plus": Plus,
  "project": Folders,
  "quiz": ListChecks,
  "search": Search,
  "settings": Settings,
  "sparkle": Sparkles,
  "star": Star,
  "target": Target,
  "trash": Trash2,
  "upload": Upload,
  "user": User,
  "warning": TriangleAlert,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-label"?: string;
}

export function Icon({ name, size = 20, strokeWidth = 1.75, className, ...rest }: IconProps) {
  const Component = ICONS[name];
  return (
    <Component
      size={size}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      aria-hidden={rest["aria-label"] ? undefined : true}
      {...rest}
    />
  );
}
