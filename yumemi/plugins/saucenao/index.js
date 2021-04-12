class Saucenao {
  static user = new Set();
  static db = 999;
  static output_type = 2;
  static testmode = 1;
  static numres = 3;
  static api = tools.getYAML('api').saucenao;
}

!Saucenao.api.key ?
  bot.logger.warn(`你没有添加 apikey ，saucenao 服务将无法使用！`) :
  void (0);

module.exports = ctx => {
  const { group_id } = ctx;
  const { url, key } = Saucenao.api;

  if (!key && raw_message === '搜图') {
    bot.sendGroupMsg(group_id, `你没有添加 apikey !`);
    return;
  } else if (!key) {
    return;
  }

  const { user_id, raw_message } = ctx;

  if (!Saucenao.user.has(user_id) && raw_message !== '搜图') {
    return;
  } else if (!Saucenao.user.has(user_id)) {
    Saucenao.user.add(user_id)
    bot.sendGroupMsg(group_id, `请发送你要搜索的图片 (●'◡'●)`);
    return;
  } else if (raw_message !== '搜图') {
    Saucenao.user.delete(user_id);
    const image = raw_message.match(/(?<=url=).*(?=\])/g);
    console.log(image)

    // https://saucenao.com/search.php?db=999&output_type=2&testmode=1&numres=16&url=http%3A%2F%2Fsaucenao.com%2Fimages%2Fstatic%2Fbanner.gif
    tools.getHttps(`${url}db=${Saucenao.db}&output_type=${Saucenao.output_type}&testmode=1&numres=${Saucenao.numres}&api_key=${key}&url=${image}`)
      .then(data => {
        const search = data.results.map(results => {
          const { header: { similarity, thumbnail, index_name }, data } = results;

          return `${index_name.match(/(?<=: ).*(?=\ -)/g)}\n相似度：${similarity}%\n略缩图：[CQ:image,file=${thumbnail},timeout=10]\n${JSON.stringify(data, null, 2)}`;
        });

        bot.sendGroupMsg(group_id, search.join('\n'));
      })
      .catch(err => {
        bot.sendGroupMsg(group_id, err ? err : `Timeout`);
      })
  }
}