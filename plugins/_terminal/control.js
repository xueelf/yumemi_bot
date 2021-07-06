const { getPlugins } = require('../../dist/plugin');
const { getLevel, setProfile } = require('../../dist/util');

// 插件控制
module.exports = async function control(data, bot) {
  const { uin, groups } = bot;
  const { group_id, user_id, raw_message, reply } = data;
  const [action, plugin] = raw_message.split(' ');

  const isAll = plugin === 'all';
  const isEnable = action === '>enable';
  const plugins = groups[group_id].plugins;

  let msg = null;

  switch (true) {
    case isEnable && !isAll && !getPlugins().has(plugin):
      msg = `不存在 ${plugin} 服务，请输入合法参数`;
      break

    case isEnable && plugins.includes(plugin):
      msg = `已启用 ${plugin} 服务，不要重复启用`;
      break

    case action === '>disable' && !isAll && !plugins.includes(plugin):
      msg = `没有启用 ${plugin} 服务，不要重复禁用`;
      break
    case isAll:
      plugins.length = 0;
      break
  }

  if (msg) {
    reply(msg);
    return;
  }

  const level = await getLevel(data, bot);

  if (!isAll && level < 4 && groups[group_id].settings[plugin].lock) {
    reply(`${plugin} 已被锁定，解锁需要达到 level 4，你当前为 Level ${level} 无法修改参数`);
    return;
  }
  if (!isAll && level > 3 && groups[group_id].settings[plugin].lock) {
    reply(`${plugin} 已被锁定，需要先解锁才能修改相关参数`);
    return;
  }
  // >disable all 不受 lock 影响
  if (level > 2) {
    isEnable ?
      (
        !isAll ?
          plugins.push(plugin) :
          getPlugins().forEach((val, key) => /^(?!_).+/.test(key) && !groups[group_id].settings[key].lock && plugins.push(key))
      ) :
      plugins.splice(plugins.findIndex(item => item === plugin), 1);

    setProfile(uin.toString(), groups, './config/groups')
      .then(() => {
        if (!isAll) {
          reply(`plugin: {\n  "${plugin}": ${isEnable ? "deactivate  >>>  activate" : "activate  >>>  deactivate"}\n}`);
        } else {
          reply(isEnable ? '所有插件加载完毕 ♪' : '所有插件已禁用');
        }
      })
      .catch((err) => {
        reply(err);
      })
  } else {
    bot.setGroupBan(group_id, user_id, 60 * 5);
    reply(`你当前为 level ${level} ，修改配置文件要达到 level 3 ，权限不足，请不要乱碰奇怪的开关`);
  }
}