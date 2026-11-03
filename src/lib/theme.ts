/** Brand colors chosen by the owner in "Aparência". Defaults match the original design. */
export interface BrandColors {
  primary: string;
  background: string;
  text: string;
}

export const DEFAULT_BRAND: BrandColors = { primary: "#aff608", background: "#080808", text: "#ffffff" };

export function isHexColor(v: string | null | undefined): v is string {
  return !!v && /^#[0-9a-fA-F]{6}$/.test(v);
}

function clean(c: Partial<BrandColors> | null | undefined): BrandColors {
  return {
    primary: isHexColor(c?.primary) ? c.primary.toLowerCase() : DEFAULT_BRAND.primary,
    background: isHexColor(c?.background) ? c.background.toLowerCase() : DEFAULT_BRAND.background,
    text: isHexColor(c?.text) ? c.text.toLowerCase() : DEFAULT_BRAND.text,
  };
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Dark or white text, whichever reads better on the given color. */
export function readableOn(hex: string): string {
  return contrastRatio(hex, "#080808") >= contrastRatio(hex, "#ffffff") ? "#080808" : "#ffffff";
}

export function isDefaultBrand(c: Partial<BrandColors> | null | undefined): boolean {
  const b = clean(c);
  return b.primary === DEFAULT_BRAND.primary && b.background === DEFAULT_BRAND.background && b.text === DEFAULT_BRAND.text;
}

const mix = (a: string, pct: number, b: string) => `color-mix(in oklab, ${a} ${pct}%, ${b})`;

/** CSS custom properties that re-theme the whole site from three colors. */
export function themeVars(input: Partial<BrandColors> | null | undefined): Record<string, string> {
  const { primary: P, background: BG, text: T } = clean(input);
  const onP = readableOn(P);
  return {
    "--primary": P,
    "--ring": P,
    "--success": P,
    "--chart-1": P,
    "--sidebar-primary": P,
    "--sidebar-ring": P,
    "--primary-foreground": onP,
    "--sidebar-primary-foreground": onP,
    "--primary-glow": mix(P, 80, "#ffffff"),
    "--background": BG,
    "--foreground": T,
    "--card-foreground": T,
    "--popover-foreground": T,
    "--secondary-foreground": T,
    "--accent-foreground": T,
    "--sidebar-accent-foreground": T,
    "--surface": mix(T, 4, BG),
    "--card": mix(T, 4, BG),
    "--surface-raised": mix(T, 8, BG),
    "--popover": mix(T, 6.5, BG),
    "--secondary": mix(T, 12, BG),
    "--muted": mix(T, 10, BG),
    "--muted-foreground": mix(T, 66, BG),
    "--accent": mix(P, 15, BG),
    "--sidebar": mix(T, 2.5, BG),
    "--sidebar-foreground": mix(T, 92, BG),
    "--sidebar-accent": mix(T, 10, BG),
    "--border": mix(T, 9, "transparent"),
    "--input": mix(T, 14, "transparent"),
    "--sidebar-border": mix(T, 8, "transparent"),
    "--gradient-hero": `linear-gradient(180deg, ${mix(BG, 30, "transparent")} 0%, ${mix(BG, 75, "transparent")} 60%, ${BG} 100%)`,
    "--gradient-radial-glow": `radial-gradient(60% 50% at 50% 0%, ${mix(P, 18, "transparent")} 0%, transparent 70%)`,
  };
}

/** Empty string when the colors are the original ones (the stylesheet already has them). */
export function themeCss(input: Partial<BrandColors> | null | undefined): string {
  if (isDefaultBrand(input)) return "";
  const body = Object.entries(themeVars(input))
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  const scheme = luminance(clean(input).background) > 0.4 ? "html{color-scheme:light}" : "";
  return `:root{${body}}${scheme}`;
}
