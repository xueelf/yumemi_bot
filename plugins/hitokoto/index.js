const { getConfig, getConfigSync, scheduleJob, httpsRequest } = require('../../utils/util');

const { hitokoto: { url, params } } = getConfigSync('api');

// 每天24点定时发送
scheduleJob('0 0 0 * * ?', async () => {
  const groups = await getConfig('groups');

  get()
    .then(data => {
      // 判断开启服务的群
      for (const group_id in groups) {
        if (!groups[group_id].enable) continue;

        groups[group_id].plugins.hitokoto.enable && bot.sendGroupMsg(group_id, data);
      }
    })
    .catch(err => {
      err && bot.logger.error(`Error: ${err.message}`);
    })
});

const get = () => {
  return new Promise((resolve, reject) => {
    httpsRequest.get(`${url}${params}`)
      .then(res => {
        const { hitokoto, from } = res;
        const msg = `${hitokoto}\n\t\t\t\t———— 「${from}」`;

        resolve(msg);
      })
      .catch(err => {
        reject(err);
      });
  })
}

const send = ctx => {
  get()
    .then(data => {
      ctx.reply(data);
    })
    .catch(err => {
      ctx.reply(err ? `Error: ${err.message}` : `Timeout: 请求超时`);
    })
}

module.exports = { send };