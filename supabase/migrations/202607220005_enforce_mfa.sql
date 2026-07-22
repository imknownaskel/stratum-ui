-- Defense in depth: direct Supabase access must also have an AAL2 session.
drop policy if exists "Require MFA for profiles" on public.profiles;
create policy "Require MFA for profiles" on public.profiles
  as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

drop policy if exists "Require MFA for preferences" on public.user_preferences;
create policy "Require MFA for preferences" on public.user_preferences
  as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

drop policy if exists "Require MFA for policy documents" on public.policy_documents;
create policy "Require MFA for policy documents" on public.policy_documents
  as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

drop policy if exists "Require MFA for policy files" on storage.objects;
create policy "Require MFA for policy files" on storage.objects
  as restrictive for all to authenticated
  using (
    bucket_id <> 'policy-documents'
    or (select auth.jwt()->>'aal') = 'aal2'
  )
  with check (
    bucket_id <> 'policy-documents'
    or (select auth.jwt()->>'aal') = 'aal2'
  );
