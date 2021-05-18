const Router = require('koa-router');
const webhook = new Router();
const bodyParser = require('koa-bodyparser');

webhook.use(bodyParser());
webhook.post('/', async ctx => {
  ctx.status = 200;
  const event = ctx.request.header['x-github-event'];

  switch (event) {
    case 'push':
      const { ref, repository: { full_name }, head_commit: { message, timestamp, url, author: { name }, committer: { username } } } = ctx.request.body;
      if (ref !== 'refs/heads/master') {
        bot.logger.info(`${ref} 分支有新的提交，但不是 master 分支，不会推送`);
        return;
      }
      const commit = message.split('\n\n');

      const pushInfo = `Received a push event for ${full_name} to ${ref}
Summary: ${commit[0]}
Description: 
\t${commit[1].replace(/\n/g, '\n\t')}
Author: ${name}
Committer: ${username}
Updated: ${timestamp}
Link: ${url}`;

      bot.gl.forEach(val => {
        const { group_id } = val;

        bot.sendGroupMsg(group_id, pushInfo);
      });
      break;
  }
})

module.exports = webhook;