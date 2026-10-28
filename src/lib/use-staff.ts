import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StaffInfo {
  userId: string;
  name: string;
  isAdmin: boolean;
  isBarber: boolean;
  barberId: string | null;
}

export function useStaff() {
  return useQuery({
    queryKey: ["staff", "me"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<StaffInfo | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;
      const [{ data: roles }, { data: profile }, { data: barber }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("barbers").select("id, name").eq("user_id", user.id).maybeSingle(),
      ]);
      const list = roles?.map((r) => r.role) ?? [];
      return {
        userId: user.id,
        name: profile?.full_name || barber?.name || "Equipe",
        isAdmin: list.includes("admin"),
        isBarber: list.includes("barber"),
        barberId: barber?.id ?? null,
      };
    },
  });
}
