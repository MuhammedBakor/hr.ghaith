const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAuth, requireOrgScope, requirePerm } = require('../../../kernel/internalGuards.NOTE');

router.get('/public_site/presets',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    const p = path.join(__dirname,'..','presets','presets.json');
    const data = JSON.parse(fs.readFileSync(p,'utf-8'));
    res.json({ ok:true, presets: data.presets || [] });
  }
);

module.exports = router;
