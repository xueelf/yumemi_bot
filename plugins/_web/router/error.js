const Router = require('koa-router');
const error = new Router();

error.get('/', async ctx => {
  ctx.body = '你不该来这里';
})

module.exports = error;