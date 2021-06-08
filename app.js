const { access, readdirSync } = require('fs');
const { createClient } = require('oicq');
const { getConfig, getConfigSync, setConfig, checkGroupConfig } = require('./utils/util');

class Bot {
  constructor(account, password, config) {
    this.account = account;
    this.password = password;
    this.config = config;
  }

  // 账号登录
  linkStart() {
    const bot = createClient(this.account, this.config);

    // 监听并输入滑动验证码 ticket
    bot.on("system.login.slider", () => {
      process.stdin.once("data", input => {
        bot.sliderLogin(input);
      });
    });

    // 监听设备锁验证
    bot.on("system.login.device", () => {
      bot.logger.info("验证完成后敲击Enter继续..");
      process.stdin.once("data", () => {
        bot.login();
      });
    });

    bot.login(this.password);
    return bot;
  }
}

class Context {
  constructor(message_id, group_id, group_name, raw_message, user_id, nickname, card, level, reply) {
    this.message_id = message_id;
    this.group_id = group_id;
    this.group_name = group_name;
    this.raw_message = raw_message;
    this.user_id = user_id;
    this.nickname = nickname;
    this.card = card;
    this.level = level;
    this.reply = reply;
  }
}

// Acsii Font Name: Mini: http://patorjk.com/software/taag/
const logo = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 

--------------------------------------------------------------------------------------------`;
console.log(logo);

const { qq: { admin, master, account, password }, info: { version, released, changelogs }, config } = getConfigSync('bot');

global.__yumemi = __dirname;
global.bot = new Bot(account, password, config).linkStart();

// 打印 bot 信息
bot.logger.mark(`----------`);
bot.logger.mark(`Package Version: ${version} (Released on ${released})`);
bot.logger.mark(`View Changelogs：${changelogs}`);
bot.logger.mark(`----------`);

const plugins = {};
const cmd = getConfigSync('cmd');

// 登录成功
bot.on('system.online', () => {
  const plugins_dir = readdirSync('./plugins');

  for (const plugin of plugins_dir) {
    // 插件是否存在 index.js 文件
    access(`./plugins/${plugin}/index.js`, err => {
      !err ?
        plugins[plugin] = require(`./plugins/${plugin}/index`) :
        bot.logger.warn(`${plugin} 模块未加载`);
    });
  }

  checkGroupConfig();
});

// 监听群消息
bot.on('message.group', async data => {
  // 获取群聊信息
  const { group_id, group_name, raw_message, sender: { user_id, level: lv, role }, reply } = data;

  const groups = await getConfig('groups');
  const group = groups[group_id];
  const level = user_id !== admin ? (user_id !== master ? (role === 'member' ? (lv < 5 ? (lv < 3 ? 0 : 1) : 2) : (role === 'admin' ? 3 : 4)) : 5) : 6;

  // 群消息是否监听
  if (!group.enable) {
    if (level > 4 && /^(开启|打开|启用)群服务$/.test(raw_message)) {
      groups[group_id].enable = true;

      setConfig('groups', groups);
      reply(`当前群聊已成功开启服务 ♪`)
    } else if (/^(开启|打开|启用)群服务$/.test(raw_message)) {
      reply(`你当前为 Level ${level}，开启群服务需要达到 Level 5`)
    } else {
      bot.logger.mark(`群聊 ${group_name} (${group_id}) 未开启服务`);
    }

    return;
  }

  // 创建 ctx 实例
  const { message_id, sender: { nickname, card } } = data;
  const ctx = new Context(message_id, group_id, group_name, raw_message, user_id, nickname, card, level, reply)

  // 正则匹配
  for (const plugin in cmd) {
    for (const serve in cmd[plugin]) {
      const reg = new RegExp(cmd[plugin][serve]);

      if (!reg.test(ctx.raw_message)) continue;

      // 模块是否启用
      if (/^[a-z]/.test(plugin)) {
        const {
          plugins: {
            [plugin]: { enable }
          }
        } = group;

        if (!enable) continue;
      }

      plugins[plugin][serve](ctx);
    }
  }
});

// 监听群事件
bot.on('notice.group', async data => {
  // 获取群聊信息
  const { group_id, group_name } = data;
  const group = await getConfig('groups').then(data => data[group_id]);

  if (!group.enable) return bot.logger.mark(`群聊 ${group_name} (${group_id}) 未开启服务`);

  // 群事件处理全写在 greet
  plugins._greet(data);
});

//自动同意群邀请
// bot.on("request.group.invite", (data) => {
//   bot.setGroupAddRequest(data.flag)
//     .then(() => {
//       // 更新群配置文件
//       checkGroupConfig();
//     })
// });