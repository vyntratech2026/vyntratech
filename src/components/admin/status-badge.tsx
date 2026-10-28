import { STATUS_LABELS, type AppointmentStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

const STYLES: Record<AppointmentStatus, string> = {
  pending: "border-warning/40 bg-warning/10 text-warning",
  confirmed: "border-primary/40 bg-primary/10 text-primary",
  completed: "border-info/40 bg-info/10 text-info",
  cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
  no_show: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
