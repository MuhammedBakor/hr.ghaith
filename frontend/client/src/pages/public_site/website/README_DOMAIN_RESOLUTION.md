# Domain -> Website Resolution (v4.35.0)

Add middleware BEFORE public routes:

```js
const { publicSiteResolver } = require('../../kernel/public_site_resolver.middleware');

app.use((req,res,next)=>{ req.ctx = req.ctx || {}; next(); });
app.use(publicSiteResolver());
app.use(require('../modules/public_site/website/stubs/public.website.content.router'));
```

Settings (import into platform settings_scoped registry if you want):
- public.site_resolver.cache_ttl_ms
- public.site_resolver.allow_unverified
