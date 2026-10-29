export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      <p>{text}</p>
      {action}
    </div>
  );
}

export function AdminOnly({ isAdmin, children }: { isAdmin: boolean; children: React.ReactNode }) {
  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
        Esta área é exclusiva do administrador.
      </div>
    );
  }
  return <>{children}</>;
}
