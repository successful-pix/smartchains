-- Allow administrators to manage account status and KYC status through the admin UI.
-- This policy is safe because public.is_admin() checks the caller's own profile role.

drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_admin_manage on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists kyc_submissions_admin_read on public.kyc_submissions;
create policy kyc_submissions_admin_read on public.kyc_submissions
  for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists kyc_submissions_admin_update on public.kyc_submissions;
create policy kyc_submissions_admin_update on public.kyc_submissions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
