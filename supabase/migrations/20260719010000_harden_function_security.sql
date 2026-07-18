-- Fix advisor warnings surfaced after the initial schema push.

-- function_search_path_mutable: pin search_path so this function can't be
-- hijacked by a malicious object shadowing an identifier in another schema.
alter function public.set_updated_at() set search_path = public;

-- anon_security_definer_function_executable /
-- authenticated_security_definer_function_executable: handle_new_user is a
-- trigger function (returns trigger) and is only ever meant to run via the
-- on_auth_user_created trigger. PostgREST still auto-exposes it as an RPC
-- endpoint and grants anon/authenticated EXECUTE by default; revoke that so
-- it can't be listed/attempted as a public API call.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
