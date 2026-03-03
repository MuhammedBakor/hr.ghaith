/**
 * LEGACY STUB (fixed for parse-safety)
 * This router exists for backward compatibility. It is NOT mounted in the main runtime by default.
 * Keep file syntactically valid to avoid tooling failures.
 */
const express = require('express');
const router = express.Router();

router.get('/__legacy_stub__/internal.website.brand.router', (req,res)=> {
  res.status(501).json({ ok:false, stub:true, module:'public_site', router:'internal.website.brand.router', note:'Legacy stub placeholder. Mount intentionally disabled.' });
});

module.exports = router;
