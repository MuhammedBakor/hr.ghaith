const express = require('express');
const router = express.Router();
router.use(require('./stubs/internal.ai_studio.router'));
module.exports = router;
