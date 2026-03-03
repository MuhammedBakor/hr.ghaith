const express = require('express');
const router = express.Router();
router.use(require('./stubs/public.website.content.router'));
module.exports = router;
