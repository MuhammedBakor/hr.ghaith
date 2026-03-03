// htmlSanitizer.ts — Enhanced HTML sanitizer (v82 security fix)
// RECOMMENDED: Replace with DOMPurify in production for complete protection
// This is a defense-in-depth sanitizer for server-rendered HTML previews

// Dangerous URL schemes
const DANGEROUS_SCHEMES = /^\s*(javascript|vbscript|data)\s*:/i;

// CSS injection patterns  
const DANGEROUS_CSS = /expression\s*\(|url\s*\(\s*(javascript|vbscript|data)\s*:|behavior\s*:|@import|\\\\|moz-binding/gi;

// Tags to remove WITH their content
const STRIP_WITH_CONTENT = /<(script|style|iframe|object|embed|applet|form|link|meta|base|svg|math|template|xmp|noscript|noembed|plaintext)[\s>][\s\S]*?<\/\1>/gi;
const STRIP_SELF_CLOSING = /<(script|style|iframe|object|embed|applet|form|link|meta|base|svg|math|template|xmp|noscript|noembed|plaintext)[^>]*\/?>/gi;

// Allowed tags (allowlist approach)
const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'b', 'i', 'u', 'strong', 'em', 'small', 'mark', 'del', 'ins', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'div', 'span', 'blockquote', 'pre', 'code',
  'a', 'img',
  'header', 'footer', 'main', 'section', 'article', 'aside', 'nav', 'figure', 'figcaption',
]);

/**
 * Sanitize HTML using an allowlist approach.
 * Strips all tags not in ALLOWED_TAGS, removes dangerous attributes.
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  let clean = html;
  
  // 1. Remove HTML comments (can hide payloads)
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');
  
  // 2. Remove dangerous tags WITH their content
  clean = clean.replace(STRIP_WITH_CONTENT, '');
  clean = clean.replace(STRIP_SELF_CLOSING, '');
  
  // 3. Remove event handler attributes (on*)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
  
  // 4. Replace dangerous URL schemes in href/src
  clean = clean.replace(/(href|src|action|formaction|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (match, attr, v1, v2) => {
    const val = v1 || v2 || '';
    if (DANGEROUS_SCHEMES.test(val)) return `${attr}="about:blank"`;
    return match;
  });
  
  // 5. Sanitize style attributes
  clean = clean.replace(/style\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (match, v1, v2) => {
    const val = v1 || v2 || '';
    if (DANGEROUS_CSS.test(val)) return 'style=""';
    return match;
  });
  
  // 6. Remove tags not in allowlist (keep their text content)
  clean = clean.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*\/?>/gi, (match, tag) => {
    if (ALLOWED_TAGS.has(tag.toLowerCase())) return match;
    return '';
  });
  
  // 7. Enforce rel="noopener noreferrer" on target="_blank" links
  clean = clean.replace(/<a([^>]*target\s*=\s*["']_blank["'][^>]*)>/gi, (match, attrs) => {
    if (!/rel\s*=/.test(attrs)) return `<a${attrs} rel="noopener noreferrer">`;
    return match;
  });
  
  return clean.trim();
}

/**
 * Strip ALL HTML tags, returning only text content.
 */
export function stripHTML(html: string): string {
  if (!html || typeof html !== 'string') return '';
  // SECURITY FIX: Do NOT unescape entities after stripping — that re-introduces HTML
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Escape special HTML characters for safe text insertion.
 */
export function escapeHTML(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
