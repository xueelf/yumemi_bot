const biliAPI = require('bili-api');
const { getConfig, setConfig, scheduleJob } = require('../../utils/util');

const mid = new Map([
  ['pcr_bl', 353840826],
  ['pcr_jp', 484884957],
]);

const get = mid => {
  return new Promise(resolve => {
    biliAPI({ mid }, ['dynamics'])
      .then(data => {
        const { dynamicsRaw, dynamics } = data;
        const { desc: { type, dynamic_id }, card } = dynamicsRaw[0];

        let msg = mid === 353840826 ? '【公主连结国服动态更新】/n' : '【公主连结日服动态更新】/n';
        /**
         * type 1   转发动态  item > content 文字内容 origin > item 转发动态内容
         * type 2   图片动态  item > description 文字内容 pictures 图片地址
         * type 4   文字动态  item > content 文字内容 
         * type 8   投稿视频
         * type 64  投稿专栏  summary 专栏内容 origin_image_urls 图片地址
         */
        switch (type) {
          case 2:
            const { item: { description, pictures } } = JSON.parse(card);

            msg = description;

            for (const { img_src } of pictures) msg += `\n[CQ:image,file=${img_src}]`;

            break;
          case 4:
            const { item: { content } } = JSON.parse(card);

            msg = content;
            break;
          case 64:
            const { summary, image_urls } = JSON.parse(card);

            // 添加省略号，专栏内容过长，summary 仅显示前半部分
            msg = `${summary}...`;

            for (const img_src of image_urls) msg += `\n[CQ:image,file=${img_src}]`;
            break;

          default:
            msg = null;
            bot.logger.mark(`检测到转发或投稿动态，不会推送`);
            break;
        }

        const bili_data = {
          dynamic_id,
          msg,
        }

        resolve(bili_data);
      })
  })
}

const send = async () => {
  // 获取 dynamic_id
  const bilibili = await getConfig('bilibili', __dirname);
  const groups = await getConfig('groups');
  const group_all = {
    pcr_bl: [],
    pcr_jp: [],
  };

  // 获取开启服务的群号
  for (const group_id in groups) {
    if (!groups[group_id].enable) continue;

    // 待优化
    groups[group_id].plugins.bilibili.enable && groups[group_id].plugins.bilibili.pcr_bl && group_all.pcr_bl.push(group_id);
    groups[group_id].plugins.bilibili.enable && groups[group_id].plugins.bilibili.pcr_jp && group_all.pcr_jp.push(group_id);
  }

  // 遍历 mid
  mid.forEach(async (val, key) => {
    bot.logger.mark(`正在获取 bilibili ${key} 动态...`);

    // 记录 dynamic_id
    get(val)
      .then(data => {
        const { dynamic_id, msg } = data;

        if (bilibili[key] === dynamic_id) return bot.logger.mark(`未检测到 ${key} 有新动态`);;

        // 发送消息
        msg && (() => {
          for (const group_id of group_all[key]) {
            bot.sendGroupMsg(group_id, msg);
          }

          bot.logger.mark(`${key} 动态发送完毕 ♪`);
        })();

        // 更新 dynamic_id
        bilibili[key] = dynamic_id;

        setConfig('bilibili', bilibili, __dirname)
          .then(() => {
            bot.logger.mark(`${key} dynamic_id 更新完毕`);
          })
      })
  })
}

// 每5分钟监听并发送动态
scheduleJob('0 0/5 * * * ?', async () => {
  send();
});