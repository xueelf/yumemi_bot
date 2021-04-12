const fs = require('fs');

class Setu {
  static max = 50;
  static lsp = new Map();
  static path = `${__yumemi}/data/images/setu`;
  static api = tools.getYAML('api').lolicon;

  constructor(group_id, user_id, r18, flash) {
    this.group_id = group_id;
    this.user_id = user_id;
    this.r18 = r18;
    this.flash = flash;
  }

  static async reload() {
    const { r17: { length: r17_length }, r18: { length: r18_length } } = tools.getDir('setu');

    if (r17_length > Setu.max && r18_length > Setu.max) {
      bot.logger.info(`当前本地涩图 r17 有 ${r17_length} 张，r18 有 ${r18_length} 张，数量充足，无需补充`);
      return;
    } else {
      const { url, key } = Setu.api;

      bot.logger.info(`r17 :${r17_length} ，r18 ${r18_length} ， ${r17_length < Setu.max ? 'r17, ' : ''}${r18_length < Setu.max ? 'r18' : ''} 数量不足 ${Setu.max}，开始补充库存...`)

      for (let i = 0; i <= 1; i++) {
        if (eval(`r${17 + i}_length`) > Setu.max) continue;

        await tools.getHttps(`${url}?apikey=${key}&r18=${i}&num=10&size1200=true`).then(setus => {
          const { data } = setus;
          bot.logger.mark(`开始补充 r${17 + i} 涩图`);

          for (let j = 0; j < data.length; j++) {
            tools.getHttps(data[j].url)
              .then(img => {
                // pid 与 title 之间使用 @ 符分割，title 若出现 /\.[]? 则替换为 -
                fs.writeFile(`${Setu.path}/r${17 + i}/${data[j].pid}@${data[j].title.replace(/(\/|\\|\.|\[|\]|\?)/g, '-')}${data[j].url.slice(-4)}`, img, 'binary', err => {
                  err ? bot.logger.error(err) : bot.logger.mark(`r${17 + i} setu add success: ${data[j].pid} / ${data[j].title}`);

                  // 此处只是 http 请求发送完毕，并非下载完毕
                  if (i === 1 && j === data.length - 1) bot.logger.mark(`https 请求发送完毕`);
                })
              })
              .catch(err => {
                err ? bot.logger.error(err) : void (0);
              })
          }
        }).catch(err => {
          if (err)
            bot.logger.error(err);
          else
            bot.logger.debug(`r${17 + i} https 请求发起失败，正在重新尝试...`), i--;
        })
      }
    }
  }

  random() {
    const { [!this.r18 ? 'r17' : 'r18']: images } = tools.getDir('setu');

    if (images.length < 2) return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 他喵的图都被你榨干了，一滴都没有了，请等待自动补充`);

    // const file = images[Math.floor(Math.random() * images.length)];
    const file = images.pop();
    const [pid, title] = file.split('@');

    // 闪图不可与普通消息一起发出，所以此处分割放送
    bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}]\nid: ${pid}\ntitle: ${title}`);
    bot.sendGroupMsg(this.group_id, `[CQ:image,${this.flash ? 'type=flash,' : ''}file=${Setu.path}/r${17 + this.r18}/${file}]`)
      .then(() => {
        Setu.lsp.set(this.user_id, Setu.lsp.get(this.user_id) + 1);

        fs.unlink(`${Setu.path}/r${17 + this.r18}/${file}`, err => {
          !err ?
            bot.logger.mark(`图片发送成功，已删除 ${file}`) :
            bot.logger.mark(`文件 ${file} 删除失败`)
            ;
        })
      });

    Setu.reload();
  }

  search(keyword) {
    const { url, key } = Setu.api;

    tools.getHttps(`${url}?apikey=${key}&r18=${Number(this.r18)}&keyword=${keyword}&size1200=true`)
      .then(setu => {
        const { code, msg, data } = setu;

        switch (code) {
          case -1:
            bot.sendGroupMsg(this.group_id, `${msg} api 炸了`);
            break;

          case 0:
            const { url, pid, title } = data[0];

            bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}]\npid: ${pid}\ntitle: ${title}\n----------------\n图片下载中，请耐心等待喵`);
            bot.sendGroupMsg(this.group_id, `[CQ:image,${this.flash ? 'type=flash,' : ''}file=${url},cache=1,timeout=10]`)
              .then(() => {
                // 有 bug ，若图片发送失败 lsp 还是会增加
                // oicq 暂时没有图片发送失败的事件回调，以后在改
                Setu.lsp.set(this.user_id, Setu.lsp.get(this.user_id) + 1);
              });
            break;

          case 401:
            bot.sendGroupMsg(this.group_id, `${msg} apikey 不存在或被封禁`);
            break;

          case 403:
            bot.sendGroupMsg(this.group_id, `${msg} 由于不规范的操作而被拒绝调用`);
            break;
            
          case 404:
            bot.sendGroupMsg(this.group_id, `${msg} 请输入合法的 pixiv tag`);
            break;

          case 429:
            bot.sendGroupMsg(this.group_id, `${msg} api 达到调用额度限制`);
            break;

          default:
            bot.sendGroupMsg(this.group_id, `statusCode: ${code} ，发生意料之外的问题，请联系 yuki`);
            break;
        }
      })
      .catch(err => {
        if (err) {
          bot.logger.error(`Error: ${err.message}`);
          bot.sendGroupMsg(this.group_id, `Error: ${err.message}`);
        }
        else {
          bot.logger.warn(`r${17 + i} https 请求连接超时`);
          bot.sendGroupMsg(this.group_id, `r${17 + i} https 请求连接超时`);
        }
      })
  }
}

Setu.api.key ?
  Setu.reload() :
  bot.logger.warn(`你没有添加 apikey ，setu 服务将无法使用！`);

// 每天 5 点重置 lsp
tools.scheduleJob('0 0 5 * * ?', () => Setu.lsp.clear());

module.exports = ctx => {
  const { group_id } = ctx;

  if (!Setu.api.key) {
    bot.sendGroupMsg(group_id, `你没有添加 apikey !`);
    return;
  }

  const { user_id } = ctx;

  // 判断 lsp 要了几张图，超过5张关小黑屋
  if (!Setu.lsp.has(user_id)) Setu.lsp.set(user_id, 0);
  if (Setu.lsp.get(user_id) >= 5) {
    bot.setGroupBan(group_id, user_id, 60 * 5);
    bot.sendGroupMsg(group_id, `[CQ:at,qq=${user_id}] [CQ:image,file=${__yumemi}/data/images/emoji/lsp.jpg]`);
    return;
  }

  const { raw_message, serve } = ctx;
  const { [group_id]: { plugins: { setu: { r18, flash } } } } = tools.getYAML('group');
  const setu = new Setu(group_id, user_id, r18, flash);

  switch (serve) {
    case 'random':
      setu.random()
      break;

    case 'search':
      const keyword = raw_message.slice(2, raw_message.length - 2);
      setu.search(keyword)
      break;
  }
}