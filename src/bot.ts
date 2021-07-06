import { join } from "path"
import { createHash } from "crypto"
import { Client, createClient, GroupMessageEventData, MessageEventData, PrivateMessageEventData } from 'oicq';
import { writeFileSync, readFileSync, readdirSync, promises } from "fs"

import { getProfileSync, setProfile } from './util';
import { IBot } from "./types/yumemi";
import { bindMasterEvents } from ".";

const bots: Map<number, Client> = new Map();

// 获取机器人目录
function getBotDir(): Map<string, IBot> {
  const bot_bir: Map<string, IBot> = new Map();

  for (let file_name of readdirSync('./config/bots')) {
    const bot_id: string = file_name.split('.')[0];

    bot_bir.set(bot_id, getProfileSync(bot_id, './config/bots') as IBot);
  }

  return bot_bir
}

// 账号登录
function linkStart(): Map<number, Client> {
  getBotDir().forEach((val, key) => {
    const { qq: { uin, masters }, config } = val;
    const bot = createClient(uin, config);

    bot.masters = masters;
    bots.set(uin, bot);
    bot.logger.mark(`正在登录账号 ${key} ...`);

    bot.on("system.login.slider", function () {
      bot.logger.mark("取ticket教程：https://github.com/takayama-lily/oicq/wiki/01.滑动验证码和设备锁");

      process.stdout.write("ticket: ");
      process.stdin.once("data", this.sliderLogin.bind(this));
    });

    bot.on("system.login.device", function () {
      bot.logger.info("验证完成后敲击 Enter 继续...");

      process.stdin.once("data", () => this.login());
    });

    bot.on("system.login.error", function (data) {
      if (data.message.includes("密码错误")) {
        inputPassword();
      } else {
        this.terminate();
        console.log("当前账号无法登录，按 Enter 键退出程序...")
        process.stdin.once("data", process.exit)
      }
    });

    function inputPassword() {
      bot.logger.mark("首次登录请输入密码：");

      process.stdin.once("data", (data) => {
        const input = String(data).trim();

        if (!input.length) return inputPassword();

        const password = createHash("md5").update(input).digest();

        writeFileSync(join(bot.dir, "password"), password, { mode: 0o600 });
        bot.login(password);
      })
    }

    try {
      bot.login(readFileSync(join(bot.dir, "password")));
    } catch {
      inputPassword();
    }
  });

  return bots;
}

// 创建新的机器人
function createNewBot(uin: number, delegate: PrivateMessageEventData | GroupMessageEventData, bot: Client): Promise<Client> {
  return new Promise(async (resolve, reject) => {
    const bot_info: IBot = {
      qq: { masters: [delegate.user_id], uin: uin }, plugins: [],
      config: { log_level: 'info', platform: 5, kickoff: false, ignore_self: true, data_dir: 'data/oicq' }
    }

    try {
      var new_bot = createClient(uin, bot_info.config)
    } catch (e) {
      delegate.reply("账号输入错误")
      return
    }

    new_bot.on("system.login.slider", function (data) {
      delegate.reply(`收到滑动验证码，请前往 ${data.url} 完成滑动并取出 ticket 输入。\n取消登录输入：cancel
取ticket教程：https://github.com/takayama-lily/oicq/wiki/01.滑动验证码和设备锁`)
      bot.on("message.private", function a(data) {
        if (data.user_id === delegate.user_id) {
          this.off("message.private", a)
          if (data.raw_message === "cancel") {
            delegate.reply("已取消登录")
            new_bot.terminate()
          } else {
            new_bot.sliderLogin(data.raw_message)
          }
        }
      })
    })

    new_bot.on("system.login.device", function (data) {
      delegate.reply(`需要验证设备锁，请前往 ${data.url} 完成验证后输入"ok"。\n>取消登录输入："cancel"`)
      bot.on("message.private", function b(data) {
        if (data.user_id === delegate.user_id) {
          this.off("message.private", b)
          if (data.raw_message === "cancel") {
            delegate.reply("已取消登录")
            new_bot.terminate()
          } else {
            new_bot.login()
            delegate.reply("登录完成，可使用 \">bot\" 命令查看是否登录成功")
          }
        }
      })
    })

    new_bot.on("system.login.error", function (data) {
      if (data.message.includes("密码错误")) {
        delegate.reply(`密码错误`)
        inputPassword()
      } else {
        this.terminate()
        delegate.reply(`登录遇到错误：${data.message}\n登录已取消`)
      }
    });

    function inputPassword() {
      delegate.reply(`首次登录请输入密码\n取消登录输入：cancel`)
      bot.on("message", async function cancel(data) {
        if (data.user_id === delegate.user_id) {
          this.off("message", cancel)
          if (data.raw_message === "cancel") {
            delegate.reply("已取消登录")
          } else {
            const password = createHash("md5").update(data.raw_message).digest();
            await promises.writeFile(join(new_bot.dir, "password"), password, { mode: 0o600 });
            new_bot.login(password)
          }
        }
      })
    }

    try {
      new_bot.login(await promises.readFile(join(new_bot.dir, "password")));
    } catch {
      inputPassword();
    }
    new_bot.masters = [delegate.user_id];
    new_bot.on('system.online', function () {
      // 绑定事件
      bindMasterEvents(new_bot);
      // 写入配置文件
      setProfile(uin.toString(), bot_info, './config/bots');
      delegate.reply(`${new_bot.nickname} (${new_bot.uin}) 登录成功`);
      resolve(new_bot);
    });
  })
}

function getBots(): Map<number, Client> {
  return bots;
}

export {
  linkStart, getBots, createNewBot
}