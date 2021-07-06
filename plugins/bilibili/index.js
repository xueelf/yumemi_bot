const { scheduleJob } = require('node-schedule');
const { getProfile, checkCommand } = require('../../dist/util');

let send_job = null;

const dids = new Map();
const mids = new Map([
  ['pcr_bl', 353840826],
  ['pcr_jp', 484884957],
]);

// 记录当前 dynamic id
mids.forEach(async (val, key) => {
  dids.set(key, await getDynamicId(val));
})

function getDynamicId(mid) {
  return new Promise((resolve, reject) => {
    getProfile(mid.toString(), './data/dynamic')
      .then(data => {
        const dynamic_id = data[0] ? data[0][0] : 0;

        resolve(dynamic_id);
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 发送动态
function send(data) {
  const { raw_message, reply } = data;

  let mid = 0;
  let msg = null;

  switch (raw_message.slice(0, 1)) {
    case '国':
      mid = mids.get('pcr_bl');
      msg = 'bilibili 近期动态：公主连结ReDive\n\n';
      break;
    case '日':
      mid = mids.get('pcr_jp');
      msg = 'bilibili 近期动态：公主连结日服情报官_\n\n';
      break;
  }

  getProfile(mid.toString(), './data/dynamic')
    .then((data) => {
      data.forEach((dynamic) => msg += `▼ ${dynamic[1]}\n\n`);

      reply(msg);
    })
    .catch(err => {
      reply(err);
    })
}

// 定时发送
function autoSend(bot) {
  send_job = scheduleJob('30 0/5 * * * ?', async () => {
    const { gl, groups } = bot;

    // 获取动态
    mids.forEach(async (val, key) => {
      const dynamic = await getProfile(val.toString(), './data/dynamic');
      const [dynamic_id, dynamic_msg] = dynamic[0];

      if (dynamic_id === dids.get(key)) {
        return
      }

      let title = 'bilibili 动态更新：';
      switch (val) {
        case 353840826:
          title += '公主连结ReDive\n\n';
          break;
        case 484884957:
          title += '公主连结日服情报官_\n\n';
          break;
      }

      // 判断开启服务的群
      gl.forEach((val) => {
        const { group_id } = val;
        const { bilibili } = groups[group_id].settings;

        if (!groups[group_id].plugins.includes('bilibili')) return

        bilibili[key] && bot.sendGroupMsg(group_id, title + dynamic_msg);
      });

      dids.set(key, dynamic_id);
    });
  });
}

function listener(data) {
  const action = checkCommand('bilibili', data, this);

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