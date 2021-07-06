const { getProfile } = require('../../dist/util');

const Koa = require('koa');
const app = new Koa();
const router = require('./router');

app.use(async (ctx, next) => {
  await next();
  global.yumemi.logger.debug(`Process ${ctx.request.method} ${ctx.request.url}`);
  ctx.status === 404 && ctx.redirect('/error');
})

app.use(router.routes());

getProfile('web')
  .then(data => {
    const { port, domain } = data;

    // 在端口监听
    app.listen(port, () => {
      global.yumemi.logger.mark(`web serve started at ${domain ? domain : 'localhost'}:${port}`);
    });
  })
  .catch(err => {
    global.yumemi.logger.error(err);
  })