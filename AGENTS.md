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
- Multi-company platform: every business table has `company_id` (default `current_company_id()`), RLS uses `is_company_admin`/`is_company_member`, membership lives in `company_members` (one company per account; `user_roles` deprecated); composite FKs keep references inside one company. Public pages live under `/$slug` and must filter every query by the company id from `useCompany()`; owners self-register (public sign-up on) and create the company via the `create_company` RPC; staff accounts are created by server functions with the admin client.
- Photos live in the private `media` bucket (5 MB) and site videos in the private `videos` bucket (50 MB, table `site_videos`); store object paths under `{company_id}/` in the DB and render through signed URLs (public buckets are blocked in this workspace).
- All dates/times are computed and displayed in America/Maceio (fixed UTC-3) via `src/lib/format.ts`.
- Brand (name, logo path, 3 hex colors) lives in `settings` is per company and provided by `CompanyProvider` from the `$slug` layout and the admin layout (`src/lib/brand.ts`); colors re-theme the site by overriding CSS variables via `src/lib/theme.ts` — never hardcode the business name or brand colors in components.
- New-booking push notices go through the server function `notifyNewBooking` (keyed by manage_token, once per appointment via `notified_at`); Pushcut URLs are restricted to api.pushcut.io and stored in admin-only `notification_settings`.
- Platform roles live in protected platform_admins; only verified accounts authorized by platform_admin_authorizations can claim them, and every platform mutation checks the role in Postgres to prevent tenant-owner privilege escalation.
- Subscription expiry is enforced by restrictive tenant RLS, appointment triggers and availability RPCs; new companies start pending, existing companies retain access, and token-based cancellation remains available so customer recovery is not blocked.
- Subscription terms are calendar months in America/Maceio; early renewals add to the remaining expiry, with an audit event for each activation or suspension.
- Commercial plan data is shared through subscriptions.ts and SubscriptionPlans; it is presentation-only and distinct from database access durations, avoiding changes to existing manual releases.
- Google review destinations are optional per-company settings, HTTPS Google links validated in the database and UI; token booking reads return that company's link and only completed bookings offer it, independently of site rating or moderation.
- Booking product requests are atomic via create_booking_with_products, validated against available products in the service's company, with quantity/name/price snapshots in appointments.product_items; keep service price and payments separate to preserve commission accounting.
- WhatsApp reminder timing is a pure planning module; sending must remain disabled until tenant-specific Meta authorization, durable delivery tracking and authenticated scheduling are implemented, to avoid implying delivery from timing calculations alone.
