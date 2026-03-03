const express = require('express');
const router = express.Router();
const { requireAuth, requireOrgScope, requirePerm } = require('../../../kernel/internalGuards.NOTE');
const { loadCatalog } = require('./marketplace.service');

router.get('/public_site/blocks/marketplace/catalog',
  requireAuth, requireOrgScope, requirePerm('public_site:blocks:read'),
  async (req,res)=>{
    res.json({ ok:true, catalog: loadCatalog() });
  }
);

module.exports = router;
