REVOKE ALL ON FUNCTION public.increment_qr_scan_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_qr_scan_count() FROM anon;
REVOKE ALL ON FUNCTION public.increment_qr_scan_count() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_qr_scan_count() TO service_role;
