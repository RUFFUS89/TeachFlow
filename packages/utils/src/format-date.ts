import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export type DateFormat = "long" | "short" | "compact" | "datetime";

const PATTERNS: Record<DateFormat, string> = {
  long: "d 'de' MMMM 'de' yyyy",
  short: "dd/MM/yyyy",
  compact: "dd/MM",
  datetime: "dd/MM/yyyy 'às' HH:mm",
};

function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

export function formatDate(value: string | Date, fmt: DateFormat = "short"): string {
  return format(toDate(value), PATTERNS[fmt], { locale: ptBR });
}

export function formatRelativeTime(value: string | Date): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true, locale: ptBR });
}
