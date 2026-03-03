const express = require('express');
const router = express.Router();
const path = require('path');
const { requireAuth, requireOrgScope, requirePerm } = require('../../../kernel/internalGuards.NOTE');

router.get('/public_site/studio',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    res.setHeader('content-type','text/html; charset=utf-8');
    res.sendFile(path.join(__dirname,'studio.html'));
  }
);

module.exports = router;
