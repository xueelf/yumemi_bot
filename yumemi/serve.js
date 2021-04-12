class GroupServe {
  static plugins = {};
  static cmd = tools.getYAML('cmd');
  static param = tools.getYAML('param');
  static plugin_dir = tools.getDir('plugins');

  constructor(message_id, group_id, group_name, user_id, raw_message, nickname, level) {
    this.message_id = message_id;
    this.group_id = group_id.toString();
    this.group_name = group_name;
    this.user_id = user_id.toString();
    this.raw_message = raw_message;
    this.nickname = nickname;
    this.level = level;
  }
}

// 上线事件
bot.on("system.online", () => {
  bot.logger.mark(`----------`);

  // 加载插件
  for (const plugin of GroupServe.plugin_dir) {
    // 插件是否存在 index.js 文件
    tools.exists(`${__yumemi}/plugins/${plugin}/index.js`) ?
      (
        GroupServe.plugins[plugin] = require(`./plugins/${plugin}/index.js`),
        bot.logger.mark(`plugin loaded: ${plugin}`)
      ) :
      bot.logger.warn(`plugin unload: ${plugin}`)
      ;
  }

  bot.logger.mark(`----------`);
  bot.logger.info(`Logged in as ${bot.nickname}♪`);
});

// 监听群消息
bot.on("message.group", data => {
  const group = tools.getYAML('group') || {};
  const { group_id, group_name } = data;
  // 不处理静态模块
  const plugins = GroupServe.plugin_dir.filter(plugin => /^[a-z]+$/g.test(plugin));

  // 校验 group.yml 配置文件
  if (!group[group_id] || Object.keys(group[group_id].plugins).length < plugins.length) {
    const param = GroupServe.param;

    if (group[group_id]) {
      bot.logger.info(`你可能添加了新的插件，正在更新群聊「${group_name} (${group_id})」配置文件...`);
    } else {
      bot.logger.info(`检测到群聊 「${group_name} (${group_id})」 未初始化信息，正在写入数据...`);

      group[group_id] = {};
      group[group_id].name = group_name;
      group[group_id].enable = false;
      group[group_id].plugins = {};
    }

    for (const plugin of plugins) {
      // 插件若是存在将 continue 处理
      if (group[group_id].plugins[plugin]) continue;

      group[group_id].plugins[plugin] = {};
      // 插件 enable 默认为 true
      group[group_id].plugins[plugin].enable = true;

      // 插件存在多参则写入
      if (param[plugin]) {
        for (const item in param[plugin]) group[group_id].plugins[plugin][item] = param[plugin][item];
      }
    }

    tools.setYAML('group', group);
  }

  const cmd = GroupServe.cmd;
  const { message_id, user_id, raw_message, sender: { nickname, card, role, level: lv } } = data;
  const level = user_id !== admin ? (user_id !== master ? (role === 'member' ? (lv < 5 ? (lv < 3 ? 0 : 1) : 2) : (role === 'admin' ? 3 : 4)) : 5) : 6;
  const ctx = new GroupServe(message_id, group_id, group_name, user_id, raw_message, !card ? nickname : card, level);
  console.log(ctx)

  // 群消息是否监听
  if (!group[group_id].enable) {
    if (level > 4 && raw_message === `开启群服务`) {
      group[group_id].enable = true;
      tools.setYAML('group', group);
      bot.sendGroupMsg(group_id, `当前群聊已成功开启服务 ♪`)
    }

    return;
  }

  GroupServe.plugins.__chat(ctx);

  out:
  // 匹配正则调用模块
  for (const plugin in cmd) {
    for (const serve in cmd[plugin]) {
      const reg = new RegExp(cmd[plugin][serve]);

      if (reg.test(ctx.raw_message)) {
        ctx.serve = serve;

        // 全局模块直接调用
        if (/^__/.test(plugin)) {
          GroupServe.plugins[plugin](ctx);
        } else {
          const { [group_id]: { plugins: { [plugin]: { enable } } } } = group;

          enable ?
            GroupServe.plugins[plugin](ctx) :
            bot.sendGroupMsg(group_id, `当前群聊 ${plugin} 模块未启用...`)
            ;
        }

        break out;
      }
    }
  }
});

// 监听群事件
bot.on('notice.group', data => {
  const { group_id } = data;
  const group = tools.getYAML('group');

  if (!group || !group[group_id] || !group[group_id].enable) return;

  // 群事件处理全写在 greet
  GroupServe.plugins.__greet(data);
});

// 自动同意群邀请
bot.on("request.group.invite", (data) => {
  bot.setGroupAddRequest(data.flag);
  bot.sendPrivateMsg(admin, JSON.stringify(data, null, 2))
});

// 自动同意好友申请
// bot.on("request.friend.add", (data) => {
//   console.log(data)
//   bot.setFriendAddRequest(data.flag);
// });