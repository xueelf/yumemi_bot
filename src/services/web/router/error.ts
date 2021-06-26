import Router from 'koa-router';

const error: Router = new Router();

error.get('/', async ctx => {
  ctx.body = '你不该来这里';
})

export default error;