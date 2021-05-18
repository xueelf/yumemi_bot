const fs = require('fs');
const { getConfig } = require(`${__yumemi}/utils/util`);
const Koa = require('koa');

const app = new Koa();
const router = require('./router');

app.use(async (ctx, next) => {
  await next();
  bot.logger.debug(`Process ${ctx.request.method} ${ctx.request.url}`);
  ctx.status === 404 && ctx.redirect('/error');
})

app.use(router.routes());

getConfig('bot')
  .then(data => {
    const { web: { port, domain } } = data;

    // 在端口监听
    app.listen(port, () => {
      bot.logger.mark(`web serve started at ${domain ? domain : 'localhost'}:${port}`);
    });
  })
  .catch(err => {
    bot.logger.error(err);
  })