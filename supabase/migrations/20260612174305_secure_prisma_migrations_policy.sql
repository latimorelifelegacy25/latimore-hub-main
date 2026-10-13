create policy service_role_all on public._prisma_migrations for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
