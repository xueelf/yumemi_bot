const fs = require('fs');
const { getConfig, scheduleJob } = require('../../utils/util');
const word = new Map();

// 12小时清空一次词库
scheduleJob('0 0 0/12 * * ?', () => word.clear());

// 聊天
const chat = async ctx => {
  const { group_id, raw_message, reply } = ctx;
  // 获取词库
  const chat = await getConfig('chat');

  // 不存在群信息则记录
  !word.has(group_id) && word.set(group_id, new Set());

  // 匹配正则调用模块
  for (const regular in chat) {
    const reg = new RegExp(regular);

    if (!reg.test(raw_message)) continue;

    // 获取随机 msg
    const msg = chat[regular][Math.floor(Math.random() * chat[regular].length)];

    if (word.get(group_id).has(msg)) return;

    reply(msg);
    word.get(group_id).add(msg);
  }
}


const ver = async ctx => {
  const { info: { released, version } } = await getConfig('bot');

  ctx.reply(`${version} ${released}`);
}

const help = async ctx => {
  const { info: { docs } } = await getConfig('bot');

  ctx.reply(`使用手册请访问：${docs} `);
}

const login = async ctx => {
  const { web: { port, domain } } = await getConfig('bot');

  ctx.reply(`登录请访问：http://${port}:${domain === 80 ? '' : domain} \n该模块刚时装，功能较少，bug较多，仅供测试`);
}

// 群服务
const list = async ctx => {
  const { group_id, reply } = ctx;
  const { [group_id]: { plugins } } = await getConfig('groups');
  const plugin_list = new Set(['当前群服务列表：']);

  for (const plugin in plugins) plugin_list.add(plugins[plugin].enable ? `|○| ${plugin} ` : ` |△| ${plugin} `);

  plugin_list.add('如要查看更多设置可输入 settings');
  reply([...plugin_list].join('\n'));
}

// 群设置
const settings = async ctx => {
  const { group_id, reply } = ctx;
  const { [group_id]: { plugins } } = await getConfig('groups');

  reply(`当前群服务设置：\n${JSON.stringify(plugins, null, 2)} \n请不要随意修改参数，除非你知道自己在做什么`);
}

// rank 表
const rank = ctx => {
  const { raw_message, reply } = ctx;
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

  fs.readdir(`./data/images/rank`, (err, data) => {
    if (err) return reply(err.message);

    const images = [];

    for (const img of data.filter(img => img.slice(0, 2) === version)) {
      images.push(`[CQ:image,file=${__yumemi}/data/images/rank/${img}]`);
    }

    reply(`※ 表格仅供参考，升r有风险，强化需谨慎\n${images.join('\n')} `);
  });
}

module.exports = { chat, ver, help, login, list, settings, rank };