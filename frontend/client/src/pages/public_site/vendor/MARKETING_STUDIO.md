# Marketing Studio (v4.51.0) — مكتبات جاهزة مواءمة مع غيث
Generated: 2026-01-10 20:50:26

## الهدف
نجيب مكتبات جاهزة (OSS) تختصر الوقت:
- محرر محتوى للمدونات/الصفحات
- Builder للـ Landing
- قوالب بريد تسويقي

لكن… بدون ما نربط المنصة على مكتبة بعينها:
✅ كل شيء خلف Adapters + Feature Flags في settings_scoped.

---

## المكتبات المقترحة (OSS)
1) Editor.js (Blocks/JSON)
2) Tiptap (Rich text)
3) GrapesJS (Landing builder)
4) MJML (Email templates)

راجع: modules/public_site/vendor/LIBRARY_REGISTRY.json

---

## Feature Flags (settings_scoped)
- marketing.studio.editor: editorjs|tiptap|off
- marketing.studio.builder: grapesjs|off
- marketing.studio.email_templates: mjml|off
- public.security.captcha_provider: none|turnstile|recaptcha

---

## تخزين البيانات (Backend)
- Pages/Landing/Blog: content_json
  - blocks (إن وجدت)
  - rich_text (html/json) للتِرمز/الشروط
  - compiled_html/css للـ builder
- Snapshots: public_content_snapshots (doc_no/versioning)

---

## تركيب المكتبات (Frontend)
هذا المسار ما يضمّن packages عشان ما نكسر إدارة الحزم الرئيسية.
لكن نعطي Snippets جاهزة.

### مثال (React)
- editorjs: @editorjs/editorjs + plugins
- tiptap: @tiptap/core + starter-kit
- grapesjs: grapesjs + @grapesjs/react
- mjml: mjml (server) أو mjml-browser (حسب السياسة)

راجع ملف:
modules/public_site/vendor/package_snippets/frontend.package.json


## ملاحظة تراخيص (مهم)
هذه الحزمة لا تتحقق من الترخيص تلقائيًا.
قبل التثبيت في الريبو الرئيسي لازم يتأكد الفريق من تراخيص الحزم المختارة (MIT/Apache-2.0 أو ما يعادلها) وتوثيقها.
