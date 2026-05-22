grant usage on schema public to service_role;

grant select, insert, update on public.contacts to service_role;
grant select, insert, update on public.conversations to service_role;
grant insert on public.audit_events to service_role;
