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

export const settingsQuery = () =>
  queryOptions({
    queryKey: ["public", "settings"],
    queryFn: async (): Promise<PublicSettings> => {
      const { data, error } = await supabase
        .from("settings")
        .select(
          "business_name, tagline, description, logo_url, cover_url, address, phone, whatsapp, instagram, maps_url, opening_hours, max_advance_days, cancellation_min_hours, cancellation_policy",
        )
        .eq("id", 1)
        .single();
      if (error) throw error;
      return { ...data, opening_hours: (data.opening_hours ?? {}) as OpeningHours };
    },
  });

export const servicesQuery = () =>
  queryOptions({
    queryKey: ["public", "services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, photo_url, price, duration_minutes")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

export const barbersQuery = () =>
  queryOptions({
    queryKey: ["public", "barbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers")
        .select("id, name, photo_url, description, specialties")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

export const barberServicesQuery = () =>
  queryOptions({
    queryKey: ["public", "barber-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("barber_services").select("barber_id, service_id");
      if (error) throw error;
      return data;
    },
  });

export const productsQuery = () =>
  queryOptions({
    queryKey: ["public", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, photo_url, price, is_available")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

export const reviewsQuery = () =>
  queryOptions({
    queryKey: ["public", "reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, reviewer_name, rating, comment, created_at")
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
