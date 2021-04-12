tools.scheduleJob('0 0 0/6 * * ?', () => {
  const images = tools.getDir('buy');
  const group = tools.getYAML('group');
  const path = `${__yumemi}/data/images/buy`;
  const img = images[Math.floor(Math.random() * images.length)];

  // 判断开启服务的群
  for (const group_id in group) {
    if (!group[group_id].enable) continue;
    if (group[group_id].plugins.buy.enable) bot.sendGroupMsg(group_id, `[CQ:image,file=${path}/${img}]`);
  }
});