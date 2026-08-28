-- Fix support chat visibility: customers must be able to read replies written by admins.
-- Admins may reply to any ticket, while customers may only write to their own tickets.

drop policy if exists support_messages_read on public.support_messages;
create policy support_messages_read on public.support_messages
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.support_tickets t
    where t.id = support_messages.ticket_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists support_messages_insert on public.support_messages;
create policy support_messages_insert on public.support_messages
for insert to authenticated
with check (
  public.is_admin()
  or (
    is_admin = false
    and user_id = auth.uid()
    and exists (
      select 1 from public.support_tickets t
      where t.id = support_messages.ticket_id
        and t.user_id = auth.uid()
    )
  )
);

drop policy if exists support_messages_update on public.support_messages;
create policy support_messages_update on public.support_messages
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Let the ticket owner and admins see support attachments belonging to that ticket's messages.
drop policy if exists support_attachment_read on storage.objects;
create policy support_attachment_read on storage.objects
for select to authenticated
using (
  bucket_id = 'support-attachments'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.support_messages m
      join public.support_tickets t on t.id = m.ticket_id
      where m.attachment_path = storage.objects.name
        and t.user_id = auth.uid()
    )
  )
);
