import { Client, GroupMessageEventData } from "oicq";
import { scheduleJob } from "node-schedule";
import { getProfileSync } from "../../utils/util";
import { readdir } from 'fs';
import { checkCommand } from "../../utils/yumemi";

const word_repeat: string[] = [];
const word_interrupt: Map<number, Set<string>> = new Map();
const thesaurus: { [word: string]: string[] } = getProfileSync('chat');

// 12 小时清空一次词库
scheduleJob('0 0 0/12 * * ?', () => word_interrupt.clear());

// 复读
function repeat(data: GroupMessageEventData) {
  const { raw_message, reply } = data;

  if (!word_repeat.includes(raw_message)) {
    word_repeat.length = 0;
  }
  word_repeat.push(raw_message);

  const { length } = word_repeat;

  if (length > 1 && length <= 5) {
    const probabilit: number = Math.floor(Math.random() * 100) + 1;

    if (probabilit < length * 20) {
      reply(raw_message);
      word_repeat.length = 6;
    }
  }
}

// 聊天
function interrupt(data: GroupMessageEventData) {
  const { group_id, raw_message, reply } = data;

  // 不存在群信息则记录
  !word_interrupt.has(group_id) && word_interrupt.set(group_id, new Set());

  // 匹配正则调用模块
  for (const regular in thesaurus) {
    const reg = new RegExp(regular);

    if (!reg.test(raw_message)) continue;

    // 获取随机 msg
    const msg = thesaurus[regular][Math.floor(Math.random() * thesaurus[regular].length)];

    if (word_interrupt.get(group_id)?.has(msg)) return;

    reply(msg);
    word_interrupt.get(group_id)?.add(msg);
  }
}

// rank 表
function rank(data: GroupMessageEventData) {
  const { raw_message, reply } = data;
  let version = raw_message.slice(0, 1);

  switch (version) {
    case 'b':
    case '国':
      version = 'bl';
      break;
    case 't':
    case '省':
    case '台':
      version = 'tw';
      break;
    case 'j':
    case '日':
      version = 'jp';
      break;
  }

  readdir(path.rank, (err, data) => {
    if (err) return reply(err.message);

    const images = [];

    for (const img of data.filter(img => img.slice(0, 2) === version)) {
      images.push(`[CQ:image,file=${path.rank}/${img}]`);
    }

    reply(`※ 表格仅供参考，升r有风险，强化需谨慎\n${images.join('\n')} `);
  });
}

function help(data: GroupMessageEventData) {
  const { reply } = data;
  const { docs } = yumemi.info;

  reply(`使用手册请访问：${docs} `);
}

function chat(bot: Client, data: GroupMessageEventData): void {
  const { chat } = yumemi.cmd;
  const { groups } = bot;
  const { group_id, raw_message } = data;

  if (!groups[group_id].plugins.includes('chat')) {
    return
  }

  repeat(data);
  interrupt(data);

  checkCommand(raw_message, chat.rank) && rank(data);
  checkCommand(raw_message, chat.help) && help(data);
}

function activate(bot: Client): void {
  bot.on("message.group", (data: GroupMessageEventData) => chat(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("message.group", chat);
}

export {
  activate, deactivate
}