const { checkCommand } = require('../../dist/util');

// 光 佬 我 要 key 
function pcrdfans(data, bot) {
  data.reply('公主连接 Re:Dive 竞技场编成数据库\n  日文：https://nomae.net/arenadb\n  中文：https://pcrdfans.com/battle');
}

function listener(data) {
  const action = checkCommand('jjc', data, this);

  action && eval(`${action}(data, this)`);
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