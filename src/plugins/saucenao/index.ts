import { Client, GroupMessageEventData } from "oicq";

import { checkCommand } from "../../utils/yumemi";
import { ISaucenao } from "../../types/saucenao";
import { getProfileSync } from "../../utils/util";
import { httpsRequest as https } from "../../utils/network";


// 获取搜图相关参数
const { saucenao: { url, key } } = yumemi.api;
const { db, numres, output_type, testmode } = <ISaucenao>getProfileSync('saucenao');

const group_info: Map<number, Set<number>> = new Map();

function search(data: GroupMessageEventData) {
  const { user_id, group_id, raw_message, reply } = data;

  !group_info.has(group_id) && group_info.set(group_id, new Set());

  const user_info: Set<number> = group_info.get(group_id) as Set<number>;

  switch (true) {
    case raw_message === '搜图' && !key:
      reply(`你没有添加 apikey ，saucenao 服务将无法使用`);
      break;

    case raw_message === '搜图' && !user_info.has(user_id):
      user_info.add(user_id);
      reply(`请发送你要搜索的图片 (●'◡'●)`);
      break;

    case raw_message !== '搜图' && user_info.has(user_id):
      user_info.delete(user_id);
      const image_url = raw_message.match(/(?<=url=).*(?=\])/g);
      // https://saucenao.com/search.php?db=999&output_type=2&testmode=1&numres=16&url=http%3A%2F%2Fcom%2Fimages%2Fstatic%2Fbanner.gif
      const params = `?db=${db}&output_type=${output_type}&testmode=${testmode}&numres=${numres}&api_key=${key}&url=${image_url}`;

      https.get(url, params)
        .then((data: any) => {
          const search = data.results.map((results: any) => {
            const { header: { similarity, thumbnail, index_name }, data } = results;

            return `平台：${index_name.match(/(?<=: ).*(?=\ -)/g)}
封面：[CQ:image,file=${thumbnail}]
相似：${similarity}%
${data.ext_urls ? `地址：${data.ext_urls.join('\n')}` : `日文：${data.jp_name}\n英语：${data.eng_name}`}\n`;
          });

          reply(search.join('\n'));
        })
        .catch(err => {
          reply(err ? err : `Timeout`);
        })
      break;
  }
}

function saucenao(bot: Client, data: GroupMessageEventData): void {
  const { saucenao } = yumemi.cmd;
  const { groups } = bot;
  const { group_id, raw_message } = data;

  if (!groups[group_id].plugins.includes('saucenao')) {
    return
  }
  checkCommand(raw_message, saucenao.search) && search(data);
}

function activate(bot: Client): void {
  bot.on("system.online", () => !key && bot.logger.warn(`你没有添加 apikey ，saucenao 服务将无法使用！`));
  bot.on("message.group", (data: GroupMessageEventData) => saucenao(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("message.group", saucenao);
}

export {
  activate, deactivate
}