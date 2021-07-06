const { checkCommand } = require('../../dist/util');
const { scheduleJob } = require('node-schedule');
const { httpsRequest } = require('../../dist/util');

let send_job = null;

// 获取一言相关参数
const { url, params } = global.yumemi.api.hitokoto;

// 获取一言
function get() {
  return new Promise((resolve, reject) => {
    httpsRequest.get(url, params)
      .then(res => {
        const msg = `${res.hitokoto}\n\t\t\t\t———— 「${res.from}」`;

        resolve(msg);
      })
      .catch(err => {
        reject(err);
      });
  })
}

// 发送一言
function send(data) {
  const { reply } = data;

  get()
    .then((data) => {
      reply(data)
    })
    .catch((err) => {
      reply(err)
    })
}

// 定时发送
function autoSend(bot) {
  send_job = scheduleJob('0 0 0 * * ?', async () => {
    const { gl, groups } = bot;

    // 判断开启服务的群
    gl.forEach(async (val) => {
      const { group_id } = val;
      const { autoSend } = groups[group_id].settings.hitokoto;

      if (groups[group_id].plugins.includes('hitokoto')) {
        autoSend && bot.sendGroupMsg(group_id, await get());
      }
    })
  })
}

function listener(data) {
  const action = checkCommand('hitokoto', data, this);

  action && eval(`${action}(data, this)`);
}

function activate(bot) {
  autoSend(bot);
  bot.on("message.group", listener);
}

function deactivate(bot) {
  bot.off("message.group", listener);
  send_job.cancel();
}

module.exports = {
  activate, deactivate
}