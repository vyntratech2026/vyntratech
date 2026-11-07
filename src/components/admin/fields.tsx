import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/site/brand";
import { uploadImage, validateImage } from "@/lib/media";
import { useCompany } from "@/lib/brand";
import { errorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";

export const selectClass =
  "h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>option]:bg-popover";

export function NativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(selectClass, props.className)} />;
}

export function PhotoField({
  value,
  onChange,
  folder,
  className,
  label = "Foto",
}: {
  value: string | null;
  onChange: (path: string | null) => void;
  folder: string;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const companyId = useCompany().id;
  return (
    <div className="flex items-center gap-4">
      <MediaImage path={value} alt={label} className={cn("size-20 shrink-0 rounded-lg", className)} />
      <div className="space-y-2">
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const problem = validateImage(file);
            if (problem) {
              toast.error(problem);
              return;
            }
            setBusy(true);
            try {
              onChange(await uploadImage(file, folder, companyId));
            } catch (err) {
              toast.error(errorMessage(err, "Não foi possível enviar a imagem."));
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
          {busy ? <Loader2 className="animate-spin" /> : <Upload />} {value ? "Trocar" : "Enviar"} {label.toLowerCase()}
        </Button>
        {value && (
          <button type="button" className="block text-xs text-muted-foreground hover:text-destructive" onClick={() => onChange(null)}>
            Remover
          </button>
        )}
        <p className="text-[11px] text-muted-foreground">JPG, PNG ou WEBP até 5 MB</p>
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, accent }: { label: string; value: string | number; hint?: string | undefined; accent?: boolean }) {
  return (
    <div className={cn("surface-card p-5", accent && "border-primary/40 shadow-glow")}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-display text-2xl font-bold sm:text-3xl", accent && "text-primary")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
