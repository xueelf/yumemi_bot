const { checkCommand, getLevel } = require('../../dist/util');

// 申请头衔
async function title(data, bot) {
  const { uin, gl } = bot;
  const { group_id, user_id, raw_message, reply } = data;
  const level = await getLevel(data, bot)

  let msg = null;
  switch (true) {
    case gl.get(group_id)?.owner_id !== uin:
      msg = `该服务需要 bot 拥有群主权限才能正常使用`;
      break;
    case level < 1:
      msg = `你当前为 Level ${level}，申请头衔需要达到 Level 1`;
      break;
  }

  if (msg) {
    reply(msg)
    return;
  }

  const title = raw_message.substr(4).trim();

  bot.setGroupSpecialTitle(group_id, user_id, title)
    .then(() => {
      reply(`[CQ:at,qq=${user_id}] 头衔已变更`);
    })
    .catch(err => {
      reply(err);
    })
}

function listener(data) {
  const action = checkCommand('master', data, this);

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