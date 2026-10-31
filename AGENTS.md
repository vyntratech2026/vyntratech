<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Booking availability and conflict rules live in Postgres (`barber_slot_ok`, `get_available_slots`, `create_booking`, exclusion constraint on `appointments`); never re-implement them only in the client — the DB is the source of truth against double booking.
- Public visitors never read private tables directly: booking, cancel and review go through SECURITY DEFINER RPCs keyed by the appointment `manage_token`.
- Anon access to public tables uses column-level GRANTs; always select explicit columns on public pages (no `select("*")`).
- Staff log in with phone + password mapped to a synthetic email (`src/lib/staff-auth.ts`); staff accounts are created only through server functions with the admin client, never by public sign-up.
- Photos live in the private `media` bucket (5 MB) and site videos in the private `videos` bucket (50 MB, table `site_videos`); store object paths in the DB and render through signed URLs (public buckets are blocked in this workspace).
- All dates/times are computed and displayed in America/Maceio (fixed UTC-3) via `src/lib/format.ts`.
