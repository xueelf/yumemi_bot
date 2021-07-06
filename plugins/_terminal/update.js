const { promises } = require('fs');
const { getLevel, setProfile } = require('../../dist/util');

// 更新配置文件
module.exports = async function update(data, bot) {
  const level = await getLevel(data, bot);
  const { uin, groups } = bot;
  const { group_id, user_id, raw_message, reply } = data;
  const [, plugin, setting, param] = raw_message.split(' ');
  const plugins = await promises.readdir('./plugins');

  if (!plugins.includes(plugin)) {
    reply(`不存在 ${plugin} 服务模块`);
    return
  }

  if (level > 2) {
    const settings = groups[group_id].settings[plugin];
    const old_settings = JSON.parse(JSON.stringify(settings));

    // 'false' 与 'true' 转换为 boolean false true
    settings[setting] = param === 'true' || param === 'false' ? param === 'true' : param;

    setProfile(uin.toString(), groups, './config/groups')
      .then(() => {
        old_settings[setting] += `  >>>  ${param}`;

        reply(`${plugin}: ${JSON.stringify(old_settings, null, 2)}`);
      })
      .catch(err => {
        bot.logger.error(err);
        reply(`${err.message}`);
      })
  } else {
    bot.setGroupBan(group_id, user_id, 60 * 5);
    reply(`你当前为 level ${level} ，修改配置文件要达到 level 3 ，权限不足，请不要乱碰奇怪的开关`);
  }
}