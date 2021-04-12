const biliAPI = require('bili-api');

const news = new Map();
const mid = {
  bl: 353840826,
  jp: 484884957,
}

news.set('bl', null);
news.set('jp', null);

tools.scheduleJob('0 0/10 * * * ?', async () => {
  const group = tools.getYAML('group');

  for (const version in mid) {
    let msg = '';
    const { dynamics } = await biliAPI({ mid: mid[version], dynamicOffset: 0 }, ['dynamics']);
    const { item, dynamic_id } = dynamics[0];

    if (!item) return bot.logger.mark(`动态更新，检测到为视频投稿，无需转发`);

    const { title } = item;
    if (!title) {
      if (title === undefined) return bot.logger.mark(`动态更新，检测到为转发的动态，无需转发`);

      const { pictures, description } = item;
      msg += description;

      if (pictures) {
        for (const { img_src } of pictures) msg += `\n[CQ:image,file=${img_src}]`;
      }
    } else {
      const { summary, image_urls } = item;

      msg += `${title}\n`;
      msg += `${summary}\n`;

      if (image_urls) {
        for (const { img_src } of image_urls) msg += `\n[CQ:image,file=${img_src}]`;
      }
    }

    if (dynamic_id === news.get(version)) {
      bot.logger.mark(`正在获取 bilibili 官方动态，未检测到新消息...`);
      return;
    }

    news.set(version, dynamic_id);
    bot.logger.mark(`检测到 ${version} 动态更新，正在发送...`);

    // 判断开启服务的群
    for (const group_id in group) {
      if (!group[group_id].enable) continue;
      if (group[group_id].plugins.bilibili.enable) {
        if (group[group_id].plugins.bilibili[version]) bot.sendGroupMsg(group_id, `${version === 'bl' ? '公主链接国服' : '公主链接日服'} ${msg}`);
      }
    }

    bot.logger.mark(`动态发送完毕`);
  }
});