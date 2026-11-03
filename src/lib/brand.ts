import { getRouteApi } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BRAND, type BrandColors } from "./theme";

export const DEFAULT_BUSINESS_NAME = "Studio Cleison Cortes";

export interface Brand {
  name: string;
  logoPath: string | null;
  colors: BrandColors;
}

export const DEFAULT_BRAND_INFO: Brand = { name: DEFAULT_BUSINESS_NAME, logoPath: null, colors: DEFAULT_BRAND };

/** Loaded once in the root route so name, logo and colors are right on the first paint. */
export async function loadBrand(): Promise<Brand> {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("business_name, logo_url, brand_primary, brand_background, brand_text")
      .eq("id", 1)
      .single();
    if (error || !data) return DEFAULT_BRAND_INFO;
    return {
      name: data.business_name?.trim() || DEFAULT_BUSINESS_NAME,
      logoPath: data.logo_url,
      colors: { primary: data.brand_primary, background: data.brand_background, text: data.brand_text },
    };
  } catch {
    return DEFAULT_BRAND_INFO;
  }
}

const rootApi = getRouteApi("__root__");

export function useBrand(): Brand {
  const data = rootApi.useLoaderData() as { brand?: Brand } | undefined;
  return data?.brand ?? DEFAULT_BRAND_INFO;
}

/** Splits the name so the last word can be highlighted ("Studio Cleison" + "Cortes"). */
export function splitBrandName(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return ["", words[0] ?? ""];
  return [words.slice(0, -1).join(" "), words[words.length - 1]!];
}
