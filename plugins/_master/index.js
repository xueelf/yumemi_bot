// 申请头衔
const title = ctx => {
  const { group_id, user_id, raw_message, level, reply } = ctx;
  let msg = null;

  switch (true) {
    case bot.gl.get(group_id).owner_id !== bot.uin:
      msg = `该服务需要 bot 拥有群主权限才能正常使用`;
      break;
    case level < 2:
      msg = `你当前为 Level ${level}，申请头衔需要达到 Level 2`;
      break;
  }

  if (msg) return reply(msg);

  const title = raw_message.substr(4).trim();

  bot.setGroupSpecialTitle(group_id, user_id, title);
}

module.exports = { title };