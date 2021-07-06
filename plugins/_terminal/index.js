const { spawn } = require('child_process');
const { uptime, totalmem, freemem, version, release } = require('os');

const { getBots } = require('../../dist/bot');
const { getPlugins } = require('../../dist/plugin');
const { checkCommand, getLevel } = require('../../dist/util');
const { getSetuDir } = require('../setu/index');

const bot = require('./bot');
const sugar = require('./sugar');
const update = require('./update');
const control = require('./control');

// 锁定插件
async function lock(data, bot) {
  const { raw_message } = data;
  const plugin = raw_message.slice(2).trim();

  data.raw_message = `>update ${plugin} lock ${/锁定/.test(raw_message.slice(0, 2)) ? true : false}`;

  update(data, bot);
}

async function restart(data, bot) {
  const { reply } = data;
  const level = await getLevel(data, bot);
  if (level < 4) {
    const { group_id, user_id } = data;

    reply(`你当前为 level ${level} ，该指令需要达到 level 5 ，权限不足，请不要乱碰奇怪的开关`);
    bot.setGeoupBan(group_id, user_id, 60 * 5);
    return;
  }
  reply('正在重启程序...');

  setTimeout(() => {
    process.on('exit', () => {
      spawn(process.argv.shift(), process.argv, {
        cwd: process.cwd(),
        detached: true,
        stdio: 'inherit'
      });
    });

    process.exit(0);
  }, 1000);
}

async function shutdown(data, bot) {
  const { reply } = data;
  const level = await getLevel(data, bot);
  if (level < 4) {
    const { group_id, user_id } = data;

    reply(`你当前为 level ${level} ，该指令需要达到 level 5 ，权限不足，请不要乱碰奇怪的开关`);
    bot.setGeoupBan(group_id, user_id, 60 * 5);
    return;
  }
  reply('正在结束程序...');

  getBots().forEach((bot) => {
    bot.logout();
  });

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// 打印运行信息
async function state(data) {
  const { r17: { length: r17_length }, r18: { length: r18_length } } = await getSetuDir();

  const msg = `系统环境：${version()} ${release()}
运行时长：${(uptime() / 60 / 60).toFixed(1)} H
使用空间：${((totalmem() - freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB / ${(totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
色图库存：r17：${r17_length} / r18：${r18_length}
版本信息：${yumemi.info.version}`;

  data.reply(msg);
}

// 退出当前群聊
async function quit(data, bot) {
  const { group_id, user_id, reply } = data;
  const level = await getLevel(data, bot);

  level > 4 ?
    bot.setGroupLeave(group_id) :
    (
      reply(`你当前为 level ${level} ，退出群聊要达到 level 4 ，这是一个很危险的开关，你知道么`),
      bot.setGroupBan(group_id, user_id)
    )
    ;
}

function list(data, bot) {
  const { groups } = bot;
  const { group_id, reply } = data;
  const msg = ['当前群服务列表：'];

  getPlugins().forEach((val, key) => {
    console.log(key);
    /^(?!_).+/.test(key) && msg.push(groups[group_id].plugins.includes(key) ? `\t|○|  ${key} ` : `\t|△|  ${key} `)
  })

  msg.push('如要查看更多设置可输入 setting');
  reply(msg.join('\n'));
}

function setting(data, bot) {
  const { groups } = bot;
  const { group_id, reply } = data;

  reply(JSON.stringify(groups[group_id].settings, null, 2));
}

function listener(data) {
  const action = checkCommand('_terminal', data, this);

  action && eval(`${action}(data, this)`);
}

function activate(bot) {
  bot.on("message", listener);
}

module.exports = {
  activate
}