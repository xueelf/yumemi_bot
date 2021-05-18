const { httpRequest } = require('../../utils/util');
const battle_url = `http://localhost/api/battle`;
const avatar_info = new Map();
const timeout_info = new Map();
const sharp = require('sharp');

const avatar = async ctx => {
  const { group_id, raw_message, reply } = ctx;

  if (avatar_info.has(group_id) && raw_message === '猜头像') return reply(`当前群聊猜头像还未结束，请不要重复发起`);

  if (avatar_info.has(group_id) && raw_message !== '猜头像') {
    if (avatar_info.get(group_id).has(raw_message)) {
      const { nickname, card } = ctx;

      avatar_info.delete(group_id);
      reply(`恭喜 ${card ? card : nickname} 猜对啦~`);
      // 清除 settimeout
      clearTimeout(timeout_info.get(group_id))
    }
  }

  if (!avatar_info.has(group_id) && raw_message === '猜头像') {
    httpRequest(`${battle_url}/get_unit`, 'POST')
      .then(res => {
        const { title, image, nickname } = res;
        avatar_info.set(group_id, new Set([...nickname.split(',')]))

        const left = Math.floor(Math.random() * 79);
        const top = Math.floor(Math.random() * 79);;
        const width = 30;
        const height = 30;

        sharp(Buffer.from(image.data))
          .toBuffer((err, data, info) => {
            const complete = data.toString('base64');

            const timeout = setTimeout(() => {
              avatar_info.has(group_id) && reply(`[CQ:image,file=base64://${complete}]\n很可惜没人猜对，正确答案是 ${title}`);
              avatar_info.delete(group_id);
            }, 15000);

            timeout_info.set(group_id, timeout);
          })
          .extract({ left, top, width, height })
          .toBuffer((err, data, info) => {
            const extract = data.toString('base64');

            reply(!err ? `[CQ:image,file=base64://${extract}]\n猜猜这是哪位角色的头像，15秒后给出答案` : err);
          })
      })
      .catch(err => {
        console.log(err)
      })
  }
}

module.exports = { avatar }