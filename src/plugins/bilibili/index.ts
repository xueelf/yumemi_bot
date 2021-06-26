import { Job, scheduleJob } from 'node-schedule';
import { GroupMessageEventData, Client } from 'oicq';

import { getProfile } from '../../utils/util';
import { checkCommand } from '../../utils/yumemi';

let send_job: Job | null = null;

const dids: Map<string, number> = new Map();
const mids: Map<string, number> = new Map([
  ['pcr_bl', 353840826],
  ['pcr_jp', 484884957],
]);

// 记录当前 dynamic id
mids.forEach(async (val: number, key: string) => {
  dids.set(key, await getDynamicId(val));
})

function getDynamicId(mid: number): Promise<number> {
  return new Promise((resolve, reject) => {
    getProfile(mid.toString(), path.dynamic)
      .then(data => {
        const dynamic_id: number = data[0] ? data[0][0] : 0;

        resolve(dynamic_id);
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 发送动态
function send(data: GroupMessageEventData) {
  const { raw_message, reply } = data;

  let mid: number = 0;
  let msg: string = '';

  switch (raw_message.slice(0, 1)) {
    case '国':
      mid = <number>mids.get('pcr_bl');
      msg = 'bilibili 近期动态：公主连结ReDive\n\n';
      break;
    case '日':
      mid = <number>mids.get('pcr_jp');
      msg = 'bilibili 近期动态：公主连结日服情报官_\n\n';
      break;
  }

  getProfile(mid.toString(), path.dynamic)
    .then((data: any) => {
      data.forEach((dynamic: [number, string]) => msg += `${dynamic[1]}\n\n`);

      reply(msg);
    })
    .catch(err => {
      reply(err);
    })
}

// 定时发送
function autoSend(bot: Client): void {
  send_job = scheduleJob('30 0/5 * * * ?', async () => {
    const { gl, groups } = bot;

    // 获取动态
    mids.forEach(async (val: number, key: string) => {
      const dynamic = await getProfile(val.toString(), path.dynamic);
      const [dynamic_id, dynamic_msg] = dynamic[0];

      if (dynamic_id === dids.get(key)) {
        return false
      }

      let title: string = 'bilibili 动态更新：';
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

        if (!groups[group_id].plugins.includes('bilibili')) {
          return false
        }

        bilibili[key] && bot.sendGroupMsg(group_id, title + dynamic_msg);
      });

      dids.set(key, dynamic_id);
    });
  });
}

function bilibili(bot: Client, data: GroupMessageEventData): void {
  const { bilibili } = yumemi.cmd;
  const { groups } = bot;
  const { group_id, raw_message } = data;
  
  if (!groups[group_id].plugins.includes('bilibili')) {
    return
  }
  checkCommand(raw_message, bilibili.send) && send(data);
}

function activate(bot: Client): void {
  autoSend(bot);
  bot.on("message.group", (data: GroupMessageEventData) => bilibili(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("message.group", bilibili);
  send_job?.cancel();
}

export {
  activate, deactivate
}