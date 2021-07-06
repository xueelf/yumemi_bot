const { smallBlackRoom, lsp, url, key } = require('./index');
const { httpsRequest } = require('../../dist/util');
const random = require('./random');

module.exports = async (data, bot) => {
  if (smallBlackRoom(data, bot)) return;

  const { logger, groups } = bot;
  const { group_id, user_id, reply, raw_message } = data;
  const { settings: { setu: { r18, flash } } } = groups[group_id];

  const keyword = raw_message.slice(2, raw_message.length - 2);
  const params = `?apikey=${key}&r18=${Number(r18)}&keyword=${encodeURI(keyword)}&size1200=true`;

  httpsRequest.get(url, params)
    .then((res) => {
      const { code, msg } = res;

      switch (code) {
        case -1:
          reply(`${msg} api 炸了`);
          break;

        case 0:
          const { url, pid, title } = res.data[0];

          reply(`[CQ:at,qq=${user_id}]\npid: ${pid}\ntitle: ${title}\n----------------\n图片下载中，请耐心等待喵`);

          // 开始下载图片
          httpsRequest.get(url)
            .then(res => {
              reply(`[CQ:image,${flash ? 'type=flash,' : ''}file=base64://${res}]`)
            })
            .catch(err => {
              reply(`图片流写入失败，但已为你获取到图片地址：\n${url}`);
              err && logger.error(err.message);
            })

          lsp.set(user_id, lsp.get(user_id) + 1);
          break;

        case 401:
          reply(`${msg} apikey 不存在或被封禁`);
          break;

        case 403:
          reply(`${msg} 由于不规范的操作而被拒绝调用`);
          break;

        case 404:
          reply(`${msg}，将随机发送本地涩图`);
          random(data, bot);
          break;

        case 429:
          reply(`${msg} api 达到调用额度限制`);
          break;

        default:
          reply(`statusCode: ${code} ，发生意料之外的问题，请联系 yuki`);
          break;
      }
    })
    .catch(err => {
      reply(err.message);
      err && logger.error(err.message);
    })
}