const { unlinkSync } = require('fs');
const { getBots, createNewBot } = require('../../dist/bot');
const { deleteFile, deleteFolder, getLevel } = require('../../dist/util');

function add(data, bot, uin) {
  const bots = getBots();

  if (bots.has(uin)) {
    return reply('你已经添加该账号，若要登录请使用 >bot on <uin> 指令');
  }

  createNewBot(uin, data, bot).then(new_bot => bots.set(uin, new_bot));
}

async function off(data, uin) {
  const bots = getBots();
  const { reply } = data;
  if (!bots.has(uin)) {
    return reply(`不存在账号：${uin}`);
  }
  const bot = bots.get(uin);

  if (bot.isOnline())
    reply(`${bot.nickname} (${uin}) 正在退出登录...`), await bot.logout();
  else
    reply(`${bot.nickname} (${uin}) 已经是下线状态`);
}

async function on(data, uin) {
  const bots = getBots();
  const { reply } = data;

  if (!bots.has(uin)) {
    return reply(`不存在账号：${uin}`);
  }
  const bot = bots.get(uin);

  !bot.isOnline() ? await bot.login() : reply(`${bot.nickname} (${uin}) 已经是在线状态`);
}

async function del(data, uin) {
  const bots = getBots();
  const { reply } = data;

  if (!bots.has(uin)) {
    return reply(`不存在账号：${uin}`);
  }
  const bot = bots.get(uin);
  if (bot.isOnline()) {
    return reply(`${bot.nickname} (${uin}) 正在登录中，请先离线再删除`);
  }
  bots.delete(uin);
  // 删除配置文件
  try {
    await deleteFile(`./config/bots/${uin}.yml`);
    await deleteFolder(`./data/oicq/${uin}`);
    reply(`已删除 ${bot.nickname} (${uin}) 相关配置文件`);
  } catch (error) {
    reply(error);
  }
}

function state(data) {
  const msg = [];
  const bots = getBots();

  bots.forEach((bot, uin) => {
    const { nickname, gl, fl } = bot;

    msg.push(`▼ ${nickname} (${uin})\n\t状　态：${bot.isOnline() ? '在线' : '离线'}\n\t群　聊：${gl.size} 个\n\t好　友：${fl.size} 个\n\t消息量：${bot.getStatus().data?.msg_cnt_per_min} / 分`);
  });

  data.reply(msg.join('\n'));
}

module.exports = async (data, bot) => {
  const { raw_message } = data;
  const [, action, uin] = raw_message.split(' ');
  const level = await getLevel(data, bot);
  if (level < 4) {
    const { group_id, user_id } = data;

    reply(`你当前为 level ${level} ，该指令需要达到 level 5 ，权限不足，请不要乱碰奇怪的开关`);
    bot.setGeoupBan(group_id, user_id, 60 * 5);
    return;
  }

  switch (action) {
    case 'add':
      add(data, bot, uin);
      break;

    case 'off':
      off(data, uin);
      break;

    case 'on':
      on(data, uin);
      break;

    case 'del':
      del(data, uin);
      break;

    case 'help':
      help(data);
      break;

    default:
      state(data);
      break;
  }
}