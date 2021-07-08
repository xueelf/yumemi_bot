const { smallBlackRoom, lsp, url } = require('./index');
const { httpsRequest } = require('../../dist/util');
const random = require('./random');

module.exports = async (data, bot) => {
  if (smallBlackRoom(data, bot)) return;

  const { logger, groups } = bot;
  const { group_id, user_id, reply, raw_message } = data;
  const { settings: { setu: { r18, flash } } } = groups[group_id];

  const keyword = raw_message.slice(2, raw_message.length - 2);
  const params = `?r18=${Number(r18)}&keyword=${encodeURI(keyword)}&size=regular`;

  httpsRequest.get(url, params)
    .then((res) => {
      const { error, data } = res;

      if (data.length > 0) {
        const { urls: { regular }, pid, title } = res.data[0];

        reply(`[CQ:at,qq=${user_id}]\npid: ${pid}\ntitle: ${title}\n----------------\n图片下载中，请耐心等待喵`);

        // 开始下载图片
        httpsRequest.get(regular)
          .then(res => {
            reply(`[CQ:image,${flash ? 'type=flash,' : ''}file=base64://${res}]`)
          })
          .catch(err => {
            reply(`图片流写入失败，但已为你获取到图片地址：\n${regular}`);
            err && logger.error(err.message);
          })

        lsp.set(user_id, lsp.get(user_id) + 1);
      } else {
        !error ? random(data, bot) : reply(error)
      }
    })
    .catch(err => {
      reply(err.message);
      err && logger.error(err.message);
    })
}