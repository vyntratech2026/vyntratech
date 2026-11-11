import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StaffInfo {
  userId: string;
  name: string;
  isAdmin: boolean;
  isBarber: boolean;
  isPlatformAdmin: boolean;
  barberId: string | null;
  /** Company the account belongs to; null until the owner creates it. */
  companyId: string | null;
  companySlug: string | null;
}

export function useStaff() {
  return useQuery({
    queryKey: ["staff", "me"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<StaffInfo | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;
      const [{ data: member }, { data: profile }, { data: barber }, { data: platformAdmin, error: platformError }] = await Promise.all([
        supabase.from("company_members").select("role, company_id, companies(slug)").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("barbers").select("id, name").eq("user_id", user.id).maybeSingle(),
        supabase.rpc("claim_platform_admin"),
      ]);
      if (platformError) throw platformError;
      return {
        userId: user.id,
        name: profile?.full_name || barber?.name || "Equipe",
        isAdmin: member?.role === "admin",
        isBarber: member?.role === "barber",
        isPlatformAdmin: platformAdmin === true,
        barberId: barber?.id ?? null,
        companyId: member?.company_id ?? null,
        companySlug: member?.companies?.slug ?? null,
      };
    },
  });
}
