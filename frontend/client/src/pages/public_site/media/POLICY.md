# Media Upload Policy (v4.50.0)
Generated: 2026-01-10 20:44:34

## Goals
- منع رفع ملفات خطرة
- ضبط الحجم/النوع
- تجهيز Hook للفحص (AV/Content moderation) لاحقًا

## Default Rules (per org/website via settings_scoped)
- max_file_size_mb: 8
- allowed_mime:
  - image/png
  - image/jpeg
  - image/webp
  - image/svg+xml (optional; off by default)
- allowed_ext: png, jpg, jpeg, webp, svg
- max_files_per_request: 5

## Required Controls
- Rate limit on upload endpoint
- Sanitization for SVG if enabled (strip scripts)
- Store metadata: sha256, mime, size, uploader, created_at
- Deny: exe, js, html, zip, pdf (unless explicitly enabled later)
