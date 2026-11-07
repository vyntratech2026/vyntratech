import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OpeningHours = Record<string, { open: string; close: string; closed?: boolean } | null>;

export interface PublicSettings {
  business_name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  maps_url: string | null;
  opening_hours: OpeningHours;
  max_advance_days: number;
  cancellation_min_hours: number;
  cancellation_policy: string | null;
}

export const settingsQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["public", "settings", companyId],
    queryFn: async (): Promise<PublicSettings> => {
      const { data, error } = await supabase
        .from("settings")
        .select(
          "business_name, tagline, description, logo_url, cover_url, address, phone, whatsapp, instagram, maps_url, opening_hours, max_advance_days, cancellation_min_hours, cancellation_policy",
        )
        .eq("company_id", companyId)
        .single();
      if (error) throw error;
      return { ...data, opening_hours: (data.opening_hours ?? {}) as OpeningHours };
    },
  });

export const servicesQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["public", "services", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, photo_url, price, duration_minutes")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

export const barbersQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["public", "barbers", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers")
        .select("id, name, photo_url, description, specialties")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

export const barberServicesQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["public", "barber-services", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("barber_services").select("barber_id, service_id").eq("company_id", companyId);
      if (error) throw error;
      return data;
    },
  });

export const productsQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["public", "products", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, photo_url, price, is_available")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

export const reviewsQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["public", "reviews", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, reviewer_name, rating, comment, created_at")
        .eq("company_id", companyId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
  });

export function hasOpeningHours(oh: OpeningHours | undefined): boolean {
  return !!oh && Object.values(oh).some((d) => d && !d.closed && d.open && d.close);
}
