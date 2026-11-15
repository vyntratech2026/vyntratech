CREATE VIEW public.public_company_directory WITH (security_barrier = true) AS
SELECT id, slug, name FROM public.companies WHERE public.company_access_active(id);
GRANT SELECT ON public.public_company_directory TO anon, authenticated, service_role;
CREATE VIEW public.public_company_settings WITH (security_barrier = true) AS
SELECT company_id, business_name, tagline, description, logo_url, cover_url, address, phone, whatsapp, instagram, maps_url, google_review_url, opening_hours, slot_interval_minutes, min_advance_minutes, max_advance_days, cancellation_min_hours, cancellation_policy, brand_primary, brand_background, brand_text
FROM public.settings WHERE public.company_access_active(company_id) OR public.is_company_member(company_id);
GRANT SELECT ON public.public_company_settings TO anon, authenticated, service_role;
DROP POLICY "Public read companies" ON public.companies;
CREATE POLICY "Members read own company" ON public.companies FOR SELECT TO authenticated USING (public.is_company_member(id) OR public.is_platform_admin());
DROP POLICY "Public read settings" ON public.settings;
CREATE POLICY "Members read own settings" ON public.settings FOR SELECT TO authenticated USING (public.is_company_member(company_id));
DROP POLICY "Public read products" ON public.products;
CREATE POLICY "Public read available products" ON public.products FOR SELECT TO anon, authenticated USING (is_available AND public.company_access_active(company_id));
CREATE POLICY "Members read own products" ON public.products FOR SELECT TO authenticated USING (public.is_company_member(company_id));
REVOKE SELECT ON public.companies, public.settings, public.products FROM anon;
REVOKE SELECT (id, slug, name, business_type, created_at) ON public.companies FROM anon;
REVOKE SELECT (id, business_name, tagline, description, logo_url, cover_url, address, phone, whatsapp, instagram, maps_url, opening_hours, slot_interval_minutes, min_advance_minutes, max_advance_days, cancellation_min_hours, cancellation_policy, brand_primary, brand_background, brand_text, company_id, google_review_url) ON public.settings FROM anon;
GRANT SELECT (id, company_id, name, description, photo_url, price, is_available) ON public.products TO anon;
DROP POLICY "Public read media" ON storage.objects;
DROP POLICY "Public read videos bucket" ON storage.objects;
CREATE POLICY "Company admins read own media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media' AND auth.uid() IS NOT NULL AND public.is_company_admin(public.storage_company(name)));
CREATE POLICY "Company admins read own videos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'videos' AND auth.uid() IS NOT NULL AND public.is_company_admin(public.storage_company(name)));
CREATE FUNCTION public.is_published_site_file(p_bucket text, p_path text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT CASE WHEN p_bucket = 'media' THEN
 EXISTS (SELECT 1 FROM public.settings s WHERE s.company_id = public.storage_company(p_path) AND public.company_access_active(s.company_id) AND (s.logo_url = p_path OR s.cover_url = p_path))
 OR EXISTS (SELECT 1 FROM public.barbers b WHERE b.company_id = public.storage_company(p_path) AND public.company_access_active(b.company_id) AND b.is_active AND b.deleted_at IS NULL AND b.photo_url = p_path)
 OR EXISTS (SELECT 1 FROM public.services s WHERE s.company_id = public.storage_company(p_path) AND public.company_access_active(s.company_id) AND s.is_active AND s.photo_url = p_path)
 OR EXISTS (SELECT 1 FROM public.products p WHERE p.company_id = public.storage_company(p_path) AND public.company_access_active(p.company_id) AND p.is_available AND p.photo_url = p_path)
 WHEN p_bucket = 'videos' THEN EXISTS (SELECT 1 FROM public.site_videos v WHERE v.company_id = public.storage_company(p_path) AND public.company_access_active(v.company_id) AND v.is_active AND v.video_path = p_path)
 ELSE false END
$$;
REVOKE ALL ON FUNCTION public.is_published_site_file(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_published_site_file(text,text) TO anon, authenticated, service_role;