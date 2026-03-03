const express = require('express');
const router = express.Router();

router.use(require('./stubs/internal.website.profile.router'));
router.use(require('./stubs/internal.website.achievements.router'));
router.use(require('./stubs/internal.website.blog.router'));
router.use(require('./stubs/internal.website.campaigns.router'));

module.exports = router;
