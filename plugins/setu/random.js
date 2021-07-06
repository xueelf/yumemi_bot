const { unlink } = require('fs');
const { smallBlackRoom, getSetuDir, lsp } = require('./index');

const reload = require('./reload')

module.exports = async (data, bot) => {
  if (smallBlackRoom(data, bot)) return;

  const { logger, groups } = bot;
  const { group_id, user_id, reply } = data;
  const { settings: { setu: { r18, flash } } } = groups[group_id];
  const { [!r18 ? 'r17' : 'r18']: images } = await getSetuDir();

  if (images.length < 2) {
    reply(`[CQ:at,qq=${user_id}] 他喵的图都被你榨干了，一滴都没有了，请等待自动补充`);
    return;
  }
  const setu_file = images.pop();
  const [pid, title] = setu_file.split('&');

  // 闪图不可与普通消息一起发出，所以此处分割放送
  reply(`[CQ:at,qq=${user_id}]\nid: ${pid}\ntitle: ${title}`);
  reply(`[CQ:image,${flash ? 'type=flash,' : ''}file=./data/images/setu/r${17 + r18}/${setu_file}]`)
    .then(() => {
      lsp.set(user_id, lsp.get(user_id) + 1);

      unlink(`./data/images/setu/r${17 + r18}/${setu_file}`, err => {
        logger.mark(!err ? `图片发送成功，已删除 ${setu_file}` : `文件 ${setu_file} 删除失败`);
      })
    });

  reload();
}