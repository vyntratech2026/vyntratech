import { createFileRoute, redirect } from "@tanstack/react-router";
import { FIRST_COMPANY_SLUG } from "@/lib/company-slug";

/** Old link from before the platform: keeps the first company's shared links working. */
export const Route = createFileRoute("/agendar")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/$slug/agendar", params: { slug: FIRST_COMPANY_SLUG }, search: search as never, statusCode: 301 });
  },
});
