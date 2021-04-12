const Koa = require('koa');
const serve = require('koa-static');
const router = require('koa-router')();
const bodyParser = require('koa-bodyparser');

const app = new Koa();

// app.use(serve(`${__dirname}/public`));

app.use(async (ctx, next) => {
  console.log(`Process ${ctx.request.method}: ${ctx.request.url}`);
  await next();
});

router.get('/', async (ctx, next) => {
  ctx.body = '<img src="https://docs.littlemaple.club/public/images/emoji/newProject.jpg">';
});

router.post('/webhook', async (ctx, next) => {
  // 若需自动更新在可在此处编写对应脚本
  ctx.response.status = 200;
  // console.log(ctx.request.body)
  const event = ctx.request.header['x-github-event'];

  switch (event) {
    case 'push':
      const { ref, repository: { full_name }, head_commit: { message, timestamp, url, author: { name }, committer: { username } } } = ctx.request.body;
      const commit = message.split('\n\n');

      const pushInfo = `Received a push event for ${full_name} to ${ref}
Summary: ${commit[0]}
Description: 
${commit[1].replace(/\n/g, '\n  ')}
Author: ${name}
Committer: ${username}
Updated: ${timestamp}
Link: ${url}`;

      const group = tools.getYAML('group');
      // 判断开启服务的群
      for (const group_id in group) {
        // if (!group[group_id].enable) continue;
        bot.sendGroupMsg(group_id, pushInfo);
      }

      break;
  }
})

app.use(bodyParser());
app.use(router.routes());

const { web: { port } } = tools.getYAML('bot');
app.listen(port);
// bot.logger.info('web server is running...')