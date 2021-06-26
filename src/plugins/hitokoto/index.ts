import { Job, scheduleJob } from 'node-schedule';
import { Client, GroupMessageEventData } from 'oicq';

import { checkCommand } from '../../utils/yumemi';
import { httpsRequest as https } from '../../utils/network';

let send_job: Job;

// 获取一言相关参数
const { hitokoto: { url, params } } = yumemi.api;

// 获取一言
function get(): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, params)
      .then((res: any) => {
        const msg = `${res.hitokoto}\n\t\t\t\t———— 「${res.from}」`;

        resolve(msg);
      })
      .catch(err => {
        reject(err);
      });
  })
}

// 发送一言
function send(data: GroupMessageEventData): void {
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
function autoSend(bot: Client): void {
  send_job = scheduleJob('0 0 0 * * ?', async () => {
    const { gl, groups } = bot;

    // 判断开启服务的群
    gl.forEach(async (val) => {
      const { group_id } = val;
      const { hitokoto: { autoSend } } = groups[group_id].settings;

      if (!groups[group_id].plugins.includes('hitokoto')) {
        return false
      }
      autoSend && bot.sendGroupMsg(group_id, await get());
    })
  })
}

function hitokoto(bot: Client, data: GroupMessageEventData): void {
  const { hitokoto } = yumemi.cmd;
  const { groups } = bot;
  const { group_id, raw_message } = data;

  if (!groups[group_id].plugins.includes('hitokoto')) {
    return
  }
  checkCommand(raw_message, hitokoto.send) && send(data);
}

function activate(bot: Client): void {
  autoSend(bot);
  bot.on("message.group", (data: GroupMessageEventData) => hitokoto(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("message.group", hitokoto);
  send_job?.cancel();
}

export {
  activate, deactivate
}