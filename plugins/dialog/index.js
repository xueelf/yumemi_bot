const { checkCommand, getProfileSync } = require('../../dist/util');
const { scheduleJob } = require('node-schedule');
const { readdir } = require('fs');

const word_repeat = [];
const word_chat = new Map();
const thesaurus = getProfileSync('chat');

// 12 小时清空一次词库
scheduleJob('0 0 0/12 * * ?', () => word_chat.clear());

// 聊天
function chat(data) {
  const { group_id, raw_message, reply } = data;

  // 不存在群信息则记录
  !word_chat.has(group_id) && word_chat.set(group_id, new Set());

  // 匹配正则调用模块
  for (const regular in thesaurus) {
    const reg = new RegExp(regular);

    if (!reg.test(raw_message)) continue;

    // 获取随机 msg
    const msg = thesaurus[regular][Math.floor(Math.random() * thesaurus[regular].length)];

    if (word_chat.get(group_id).has(msg)) return;

    reply(msg);
    word_chat.get(group_id).add(msg);
  }
}

// 复读
function repeat(data) {
  const { raw_message, reply } = data;

  if (!word_repeat.includes(raw_message)) {
    word_repeat.length = 0;
  }
  word_repeat.push(raw_message);

  const { length } = word_repeat;

  if (length > 1 && length <= 5) {
    const probabilit = Math.floor(Math.random() * 100) + 1;

    if (probabilit < length * 20) {
      reply(raw_message);
      word_repeat.length = 6;
    }
  }
}

// rank 表
function rank(data) {
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

  readdir('./data/images/rank', (err, data) => {
    if (err) return reply(err.message);

    const images = [];

    for (const img of data.filter(img => img.slice(0, 2) === version)) {
      images.push(`[CQ:image,file=./data/images/rank/${img}]`);
    }

    reply(`※ 表格仅供参考，升r有风险，强化需谨慎\n${images.join('\n')} `);
  });
}

function help(data) {
  const { reply } = data;
  const { docs } = global.yumemi.info;

  reply(`使用手册请访问：${docs} `);
}

function listener(data) {
  const action = checkCommand('dialog', data, this);

  chat(data);
  repeat(data);

  action && eval(`${action}(data)`);
}

function activate(bot) {
  bot.on("message.group", listener);
}

function deactivate(bot) {
  bot.off("message.group", listener);
}

module.exports = {
  activate, deactivate
}