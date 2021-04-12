class Gacha {
  static up_prob = 0.7;
  static s3_prob = 2.5;
  static s2_prob = 18;
  static path = `${__yumemi}/plugins/gacha`;

  constructor(group_id, user_id, edition) {
    this.group_id = group_id;
    this.user_id = user_id;
    this.edition = edition;
  }

  unpaid() {

  }
}



const fs = require('fs');
const sharp = require("sharp");

module.exports = (messageData, option) => {
  const { gacha: { [messageData.group_id]: setting } } = tools.getProfile('pluginSettings')
  //读取卡池配置文件
  const gacha = JSON.parse(fs.readFileSync(`${gachaPath}gacha.json`).toString());

  // 无料十连
  const unpaid = () => {
    // 读取图片路径信息
    fs.readFile(`${gachaPath}img.json`, (err, data) => {
      if (err) {
        log.error("读取文件失败...");
      } else {
        // 传入图片路径
        let i = 1, left = 395, top = 160;
        let msg = '素敵な仲間が増えますよ~';
        const img = JSON.parse(data.toString());
        // 当群所选卡池
        // console.log(gacha[setting.version[messageData.group_id]]);
        // 写入bg流
        sharp(`${gachaPath}img/bg.jpg`).toBuffer((err, data, info) => {
          !err ?
            create(i, data, left, top) :
            bot.logger.error(err)
            ;
        });

        const create = (i, data, left, top) => {
          let src = `${gachaPath}img/unit/`;
          if (i <= 10) {
            if (i == 6) {
              left = 395;
              top = 320;
            }
            // 生成随机数
            let random = (Math.random() * 100).toFixed(1);
            // 十连 && 保底
            if (random <= gacha[setting.version].s3_prob) {
              msg = 'おめでとうございます~';
              // up
              random <= gacha[setting.version].up_prob ?
                src += img[gacha[setting.version].up[Math.floor(Math.random() * gacha[setting.version].up.length)]] :
                src += img[gacha[setting.version].star_3[Math.floor(Math.random() * gacha[setting.version].star_3.length)]];
            } else if (random <= gacha[setting.version].s2_prob || i === 10) {
              src += img[gacha[setting.version].star_2[Math.floor(Math.random() * gacha[setting.version].star_2.length)]];
            } else {
              src += img[gacha[setting.version].star_1[Math.floor(Math.random() * gacha[setting.version].star_1.length)]];
            }
            // console.log(src)
            // 写入图片流
            sharp(data).
              composite([{
                input: src,
                left: left,
                top: top
              }]).
              toBuffer().
              then(data => {
                // console.log('写入图片流成功，已写入第' + i + '次')
                create(i += 1, data, left += 160, top);
              });
          } else {
            // 生成图片
            sharp(data).toFile(`${gachaPath}img/gacha.jpg`).then(() => {
              // 发送图片
              bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] ${msg}\n[CQ:image,file=yumemi/plugins/gacha/img/gacha.jpg]`);
            });
          }
        }
      }
    });
  }
  // 傻必
  const paid = () => {
    bot.sendGroupMsg(messageData.group_id, '都不给我打钱还想抽傻子必得？');
  }

  // 卡池信息
  const info = () => {
    const gachaInfo = `当前所选卡池：${setting.version}
本期 up 角色：${gacha[setting.version].up}
--------------------------
3s 概率：${gacha[setting.version].s3_prob}%
up 概率：${gacha[setting.version].up_prob}%`
    bot.sendGroupMsg(messageData.group_id, gachaInfo);
  }

  eval(`${option}(gacha)`);
}