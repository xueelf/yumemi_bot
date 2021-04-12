const title = ctx => {
  const { group_id, user_id, raw_message } = ctx;

  if (bot.gl.get(Number(group_id)).owner_id !== bot.uin) {
    bot.sendGroupMsg(group_id, `该服务需要 bot 拥有群主权限`);
    return;
  }

  const title = raw_message.substr(4).trim();

  bot.setGroupSpecialTitle(group_id, user_id, title);
}

module.exports = ctx => {
  const { serve } = ctx;
  eval(`${serve}(ctx)`);
}