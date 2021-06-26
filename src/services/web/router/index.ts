import Router from 'koa-router';
import api from './api';
import error from './error';
import webhook from './webhook';

const router: Router = new Router();

router.use('/api', api.routes());
router.use('/error', error.routes());
router.use('/webhook', webhook.routes());

export default router;