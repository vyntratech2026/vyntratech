/** Link of the first company (owner of the links shared before the platform existed). */
export const FIRST_COMPANY_SLUG = "studio-cleison-cortes";

/** Same list as the database function slug_problem: paths the platform itself uses. */
export const RESERVED_SLUGS = [
  "admin", "auth", "agendar", "agendamento", "cadastro", "comecar", "api", "lovable", "reset-password",
  "profissional", "entrar", "login", "logout", "sair", "conta", "painel", "app", "www", "static", "assets",
  "robots", "sitemap", "favicon", "sobre", "ajuda", "suporte", "termos", "privacidade", "planos", "precos",
  "contato", "blog", "empresa", "empresas",
];

/** Turns a business name into a suggested link: "Barbearia do João" -> "barbearia-do-joao". */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

export type SlugProblem = "invalid" | "reserved" | null;

export function slugProblem(slug: string): SlugProblem {
  const v = slug.trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])$/.test(v) || v.includes("--")) return "invalid";
  if (RESERVED_SLUGS.includes(v)) return "reserved";
  return null;
}

export const BUSINESS_TYPES = [
  { value: "barbearia", label: "Barbearia" },
  { value: "salao", label: "Salão de beleza" },
  { value: "estetica", label: "Estética" },
  { value: "manicure", label: "Manicure e unhas" },
  { value: "tatuagem", label: "Tatuagem" },
  { value: "clinica", label: "Clínica ou consultório" },
  { value: "outro", label: "Outro" },
] as const;
