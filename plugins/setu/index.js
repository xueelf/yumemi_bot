const { scheduleJob } = require('node-schedule');
const { promises } = require('fs');
const { checkCommand } = require('../../dist/util');

// 获取涩图相关参数
const { url, key } = global.yumemi.api.lolicon;
const max_lsp = 5;

// 每天 5 点重置 lsp
const lsp = new Map();
scheduleJob('0 0 5 * * ?', () => lsp.clear());

// 获取色图目录
async function getSetuDir() {
  const r17 = [];
  const r18 = [];

  try {
    Object.assign(r17, await promises.readdir('./data/images/setu/r17'));
    Object.assign(r18, await promises.readdir('./data/images/setu/r18'));
  } catch (err) {
    yumemi.logger.error(err.message);
  }

  return { r17, r18 }
}

// 关小黑屋
function smallBlackRoom(data, bot) {
  const { group_id, user_id, reply } = data;

  if (!key) {
    reply(`你没有添加 apikey ，setu 服务将无法使用！`);
    return true;
  }

  // 判断 lsp 要了几张图，超过 max_lsp 张关小黑屋
  !lsp.has(user_id) && lsp.set(user_id, 0);

  if (lsp.get(user_id) >= max_lsp) {
    bot.setGroupBan(group_id, user_id, 60 * 5);
    reply(`[CQ:at,qq=${user_id}] [CQ:image,file=./data/images/emoji/lsp.jpg]`);
    return true;
  } else {
    return false
  }
}

function listener(data) {
  const action = checkCommand('setu', data, this);

  action && eval(`${action}(data, this)`);
}

function activate(bot) {
  bot.on("message.group", listener);
}

function deactivate(bot) {
  bot.off("message.group", listener);
}

module.exports = {
  lsp, url, key,
  activate, deactivate, smallBlackRoom, getSetuDir
}

const random = require('./random');
const search = require('./search');
const reload = require('./reload');

reload();