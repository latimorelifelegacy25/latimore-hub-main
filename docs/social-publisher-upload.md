# Social Publisher Upload Setup

Implemented endpoint:

- `POST /api/social/upload`

Required environment variables:

- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `SUPABASE_SOCIAL_UPLOADS_BUCKET`

Required bucket:

- `social-uploads`
- Public bucket recommended because platform publishing requires a public media URL.

Supported upload types:

- JPG
- PNG
- WEBP
- GIF

Default max size:

- 20MB
