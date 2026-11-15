import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const fetchOffers = async (companyId: string) => {
    const { data, error } = await supabase.from("customer_offers").select("id,company_id,kind,name,description,price,period_months,benefits,service_id,start_date,end_date,is_active").eq("company_id", companyId).eq("is_active", true).order("name");
    if (error) throw error;
    return data ?? [];
};
export const offersQuery = (companyId: string) => queryOptions({
  queryKey: ["public", "offers", companyId],
  queryFn: () => fetchOffers(companyId),
});