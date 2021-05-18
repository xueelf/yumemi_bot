const fs = require('fs');
const { getConfig, scheduleJob } = require('../../utils/util');

const buy_path = `${__yumemi}/data/images/buy`;
const buy_images = fs.readdirSync(`${__yumemi}/data/images/buy`);

const send = group_all => {
  const img = buy_images[Math.floor(Math.random() * buy_images.length)];

  for (const group_id of group_all) {
    bot.sendGroupMsg(group_id, `[CQ:image,file=${buy_path}/${img}]`);
  }
}

// 东八时区
scheduleJob('0 0 0/6 * * ?', async () => {
  const group_all = [];
  const groups = await getConfig('groups');

  // 判断开启服务的群
  for (const group_id in groups) {
    if (!groups[group_id].enable) continue;

    groups[group_id].plugins.buy.enable && groups[group_id].plugins.buy.version === 'cn' && group_all.push(group_id);
  }

  send(group_all)
});

// 东九时区
scheduleJob('0 0 1,7,13,19 * * ? ', async () => {
  const group_all = [];
  const groups = await getConfig('groups');

  // 判断开启服务的群
  for (const group_id in groups) {
    if (!groups[group_id].enable) continue;

    groups[group_id].plugins.buy.enable && groups[group_id].plugins.buy.version === 'jp' && group_all.push(group_id);
  }

  send(group_all)
});