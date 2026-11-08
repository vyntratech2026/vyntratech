import { createFileRoute, redirect } from "@tanstack/react-router";
import { FIRST_COMPANY_SLUG } from "@/lib/company-slug";

/** Old link from before the platform: keeps the first company's shared links working. */
export const Route = createFileRoute("/profissional/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$slug/profissional/$id", params: { slug: FIRST_COMPANY_SLUG, id: params.id }, statusCode: 301 });
  },
});
