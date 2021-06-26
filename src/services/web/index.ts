import Koa from 'koa';

import router from './router';
import { getProfile } from '../../utils/util';

const app = new Koa();
const logger = yumemi.logger;

app.use(async (ctx, next) => {
  await next();
  logger.info(`Process ${ctx.request.method} ${ctx.request.url}`);

  ctx.status === 404 && ctx.redirect('/error');
})

app.use(router.routes());

getProfile('web')
  .then(data => {
    const { port, domain } = data;

    // 在端口监听
    app.listen(port, () => {
      logger.info(`web serve started at ${domain ? domain : 'localhost'}:${port}`)
    });
  })
  .catch(err => {
    throw err;
  })