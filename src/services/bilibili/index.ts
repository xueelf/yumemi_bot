import biliAPI from 'bili-api';
import { scheduleJob } from 'node-schedule';
import { getProfile, setProfile } from '../../utils/util';

const mids: Map<string, number> = new Map([
  ['pcr_bl', 353840826],
  ['pcr_jp', 484884957],
]);
const logger = yumemi.logger;

function updateDynamic(): void {
  mids.forEach(async (val: number, key: string) => {
    const new_dynamic: string[][] = [];
    const old_dynamic = await getProfile(val.toString(), './data/dynamic');

    logger.mark(`正在获取 bilibili ${key} 动态...`);

    biliAPI({ mid: val }, ['dynamics'])
      .then(data => {
        const { dynamicsRaw } = data;

        for (const dynamic of dynamicsRaw) {
          const { desc: { type, dynamic_id }, card } = dynamic;

          // 目前只监听国服和日服，mid 写死，待优化
          let msg: string = '';
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

              msg += description;

              for (const { img_src } of pictures) msg += `\n[CQ:image,file=${img_src}]`;

              break;
            case 1:
            case 4:
              const { item: { content }, origin } = JSON.parse(card);
              const { item: { pictures: reprinted } } = JSON.parse(origin);

              msg += content;
              for (const { img_src } of reprinted) msg += `\n[CQ:image,file=${img_src}]`;

              break;
            case 64:
              const { summary, image_urls } = JSON.parse(card);

              // 添加省略号，专栏内容过长，summary 仅显示前半部分
              msg += `${summary}...`;

              for (const img_src of image_urls) msg += `\n[CQ:image,file=${img_src}]`;
              break;

            default:
              // 投稿动态不会收录
              break;
          }

          // 存储前 5 条动态
          if (new_dynamic.length > 4) break;

          msg && new_dynamic.push([dynamic_id, msg]);
        }

        if (!old_dynamic[0] || old_dynamic[0][0] !== new_dynamic[0][0]) {
          setProfile(val.toString(), new_dynamic, './data/dynamic')
            .then(() => {
              logger.mark(`${key} 动态更新完毕`);
            })
        } else {
          logger.mark(`未检测到 ${key} 有新动态`);
        }
      });
  });
}

// 每 5 分钟监听动态
scheduleJob('0 0/5 * * * ?', async () => {
  updateDynamic();
});