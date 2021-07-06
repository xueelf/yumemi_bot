const { checkCommand, httpRequest } = require('../../dist/util');
const sharp = require('sharp');

const guess_url = `http://localhost/api/guess`;
const avatar_info = new Map();
const time = 20;  // 猜头像时限

function avatar(data, bot) {
  function send(data) {
    if (data.group_id !== group_id) return
    const { complete, nicknames, timeout } = avatar_info.get(group_id);

    if (nicknames.includes(data.raw_message)) {
      const { nickname, card } = data.sender;
      data.reply(`[CQ:image,file=base64://${complete}]\n恭喜 ${card ? card : nickname} 猜对啦~\n\n关键字：${[...nicknames]}\n如有错误请联系 yuki 修改`);
      avatar_info.delete(group_id);
      // 清除 settimeout
      clearTimeout(timeout);
      this.off('message.group', send);
    }
  }

  const { group_id, raw_message, reply } = data;

  if (avatar_info.has(group_id)) return reply(`当前群聊猜头像还未结束，请不要重复发起`);

  httpRequest.post(`${guess_url}/get_unit`, undefined)
    .then(res => {
      const { title, image, nickname } = res;

      const left = Math.floor(Math.random() * 79);
      const top = Math.floor(Math.random() * 79);;
      const width = 30;
      const height = 30;

      sharp(Buffer.from(image.data))
        .jpeg({ quality: 100 })
        .toBuffer((err, data, info) => {
          const complete = data.toString('base64');
          const timeout = setTimeout(() => {
            avatar_info.has(group_id) && reply(`[CQ:image,file=base64://${complete}]\n很可惜没人猜对，正确答案是 ${title}`);
            avatar_info.delete(group_id);
            bot.off('message.group', send);
          }, time * 1000);

          avatar_info.set(group_id, {
            complete: complete,
            nicknames: nickname.split(','),
            timeout: timeout
          })
        })
        .extract({ left, top, width, height })
        .resize(80, 80)
        .toBuffer((err, data, info) => {
          const extract = data.toString('base64');
          if (!err) {
            reply(`[CQ:image,file=base64://${extract}]\n猜猜这是哪位角色的头像，${time} 秒后给出答案`);
            // 开启监听
            bot.on('message.group', send)
          } else {
            reply(err.message);
          }
        })
    })
    .catch(err => {
      console.log(err)
    })
}

function listener(data) {
  const action = checkCommand('guess', data, this);

  action && eval(`${action}(data, this)`);
}

function activate(bot) {
  bot.on("message.group", listener);
}

function deactivate(bot) {
  bot.off("message.group", listener);
}

module.exports = {
  activate, deactivate
}