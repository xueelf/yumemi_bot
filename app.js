global.__yumemi = `${__dirname}/yumemi`;
global.tools = require(`${__yumemi}/tools`);

// Acsii Font Name: Mini: http://patorjk.com/software/taag/
const logo = `--------------------------------------------------------------------------------------------        

   \\    / _  | |  _  _  ._ _   _    _|_  _           ._ _   _  ._ _  o   |_   _ _|_
    \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)   \\/ |_| | | | (/_ | | | |   |_) (_) |_
                                              /                                    
--------------------------------------------------------------------------------------------\n`;
console.log(logo);

const { createClient } = require("oicq");
const { qq: { admin, master, account, password }, config, info: { changelogs, released, version } } = tools.getYAML('bot');

global.bot = createClient(account, config);
global.admin = admin;
global.master = master;

bot.logger.mark(`Package Version: ${version} (Released on ${released})`);
bot.logger.mark(`View Changelogs：${changelogs}`);
bot.logger.mark(`----------`);

// 处理图片验证码事件
bot.on("system.login.captcha", () => {
  process.stdin.once("data", input => {
    bot.captchaLogin(input);
  });
});

// 监听并输入滑动验证码 ticket
bot.on("system.login.slider", () => {
  process.stdin.once("data", input => {
    bot.sliderLogin(input);
  });
});

// 监听设备锁验证
bot.on("system.login.device", () => {
  bot.logger.info("手机扫码完成后按下 Enter 继续...");
  process.stdin.once("data", () => {
    bot.login();
  });
});

bot.login(password);

require(`${__yumemi}/serve`);