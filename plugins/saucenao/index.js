const { getConfigSync, httpsRequest } = require('../../utils/util');

const user = new Set();
const db = 999;
/**
 * output_type
 * 
 * 0 = normal html
 * 1 = xml api(not implemented)
 * 2 = json api
 */
const output_type = 2;
const testmode = 1;
const numres = 3;
const { saucenao: { url, key } } = getConfigSync('api');

!key && bot.logger.warn(`你没有添加 apikey ，saucenao 服务将无法使用！`);

const search = ctx => {
  const { user_id, raw_message, reply } = ctx;

  if (raw_message === '搜图' && !key) {
    reply(`你没有添加 apikey ，saucenao 服务将无法使用`);
    return;
  }

  if (raw_message === '搜图' && !user.has(user_id)) {
    user.add(user_id)
    reply(`请发送你要搜索的图片 (●'◡'●)`);
  } else if (raw_message !== '搜图' && user.has(user_id)) {
    user.delete(user_id);
    const image_url = raw_message.match(/(?<=url=).*(?=\])/g);
    // https://saucenao.com/search.php?db=999&output_type=2&testmode=1&numres=16&url=http%3A%2F%2Fcom%2Fimages%2Fstatic%2Fbanner.gif
    const saucenao_url = `${url}db=${db}&output_type=${output_type}&testmode=${testmode}&numres=${numres}&api_key=${key}&url=${image_url}`;

    httpsRequest.get(saucenao_url)
      .then(data => {
        const search = data.results.map(results => {
          const { header: { similarity, thumbnail, index_name }, data } = results;

          return `平台：${index_name.match(/(?<=: ).*(?=\ -)/g)}
封面：[CQ:image,file=${thumbnail}]
相似：${similarity}%
${data.ext_urls ? `地址：${data.ext_urls.join('\n')}` : `日文：${data.eng_name}\n英语：${data.jp_name}`}\n`;
        });

        reply(search.join('\n'));
      })
      .catch(err => {
        reply(err ? err : `Timeout`);
      })
  }
}

module.exports = { search }