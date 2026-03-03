/**
 * LEGACY FILE (fixed for parse-safety)
 * Not mounted in main runtime by default.
 */
const express = require('express');
const router = express.Router();

router.get('/__legacy_stub__/internal.media.router', (req,res)=> {
  res.status(501).json({ ok:false, stub:true, legacy:true, router:'internal.media.router' });
});

module.exports = router;
