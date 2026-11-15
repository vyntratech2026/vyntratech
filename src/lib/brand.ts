import { createContext, createElement, useContext, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BRAND, type BrandColors } from "./theme";

/** Name of the platform itself (landing page, sign-up, e-mails). */
export const PLATFORM_NAME = "Vyntra Tech";

export interface Brand {
  name: string;
  logoPath: string | null;
  colors: BrandColors;
}

export interface CompanyInfo {
  id: string;
  slug: string;
  brand: Brand;
}

export const PLATFORM_BRAND: Brand = { name: PLATFORM_NAME, logoPath: null, colors: DEFAULT_BRAND };

const CompanyContext = createContext<CompanyInfo | null>(null);

export function CompanyProvider({ company, children }: { company: CompanyInfo; children: ReactNode }) {
  return createElement(CompanyContext.Provider, { value: company }, children);
}

/** The company whose site/panel is being shown, or null on platform pages. */
export function useCompanyOrNull(): CompanyInfo | null {
  return useContext(CompanyContext);
}

export function useCompany(): CompanyInfo {
  const c = useContext(CompanyContext);
  if (!c) throw new Error("useCompany used outside a company page");
  return c;
}

export function useBrand(): Brand {
  return useContext(CompanyContext)?.brand ?? PLATFORM_BRAND;
}

/** Loads a company's public brand by its link (slug). Null when it does not exist. */
export async function loadCompanyBySlug(slug: string): Promise<CompanyInfo | null> {
  const { data: company } = await supabase.from("public_company_directory").select("id, slug, name").eq("slug", slug.toLowerCase()).maybeSingle();
  if (!company) return null;
  if (!company.id || !company.slug) return null;
  return { id: company.id, slug: company.slug, brand: await loadBrand(company.id, company.name ?? "") };
}

export async function loadBrand(companyId: string, fallbackName = ""): Promise<Brand> {
  const { data } = await supabase
    .from("public_company_settings")
    .select("business_name, logo_url, brand_primary, brand_background, brand_text")
    .eq("company_id", companyId)
    .maybeSingle();
  if (!data) return { ...PLATFORM_BRAND, name: fallbackName || PLATFORM_NAME };
  return {
    name: data.business_name?.trim() || fallbackName,
    logoPath: data.logo_url,
    colors: { primary: data.brand_primary ?? DEFAULT_BRAND.primary, background: data.brand_background ?? DEFAULT_BRAND.background, text: data.brand_text ?? DEFAULT_BRAND.text },
  };
}

/** Splits the name so the last word can be highlighted ("Studio Cleison" + "Cortes"). */
export function splitBrandName(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return ["", words[0] ?? ""];
  return [words.slice(0, -1).join(" "), words[words.length - 1]!];
}

export function initials(name: string): string {
  const w = name.trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1]![0] : "")).toUpperCase() || "•";
}
