import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { CompanyProvider, loadCompanyBySlug } from "@/lib/brand";
import { themeCss } from "@/lib/theme";

/** Public site of one company: loads it by its link and applies its logo, name and colors. */
export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const company = await loadCompanyBySlug(params.slug);
    if (!company) throw notFound();
    return { company };
  },
  staleTime: 5 * 60 * 1000,
  component: CompanyLayout,
});

function CompanyLayout() {
  const { company } = Route.useLoaderData();
  const css = themeCss(company.brand.colors);
  return (
    <CompanyProvider company={company}>
      {css && <style id="brand-theme" dangerouslySetInnerHTML={{ __html: css }} />}
      <Outlet />
    </CompanyProvider>
  );
}
