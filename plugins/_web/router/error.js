const Router = require('koa-router');
const errorPage = new Router();

errorPage.get('/', async ctx => {
  ctx.body = '你不该来这里';
})

module.exports = errorPage;