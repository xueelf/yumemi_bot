const { checkCommand } = require('../../dist/util');
const { start, move, rollback, surrender, over } = require('./gobang');

function listener(data) {
  const action = checkCommand('chess', data, this);

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