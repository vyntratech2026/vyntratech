/** Service links and slot availability must not hide active team members. */
export function bookingProfessionals<T extends { id: string; is_active?: boolean; deleted_at?: string | null }>(professionals: readonly T[] | null | undefined): T[] {
  return (professionals ?? []).filter((p) => p.is_active !== false && !p.deleted_at);
}