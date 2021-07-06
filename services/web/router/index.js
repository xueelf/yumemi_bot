const Router = require('koa-router');
const router = new Router();
const api = require('./api');
const error = require('./error');
const webhook = require('./webhook');

router.use('/api', api.routes());
router.use('/error', error.routes());
router.use('/webhook', webhook.routes());

module.exports = router;