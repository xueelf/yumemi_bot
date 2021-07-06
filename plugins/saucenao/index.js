const { checkCommand, httpsRequest } = require('../../dist/util');

// 获取搜图相关参数
const { url, key } = global.yumemi.api.saucenao;
const db = 999;
/**
 * output_type
 * 0 normal html
 * 1 xml api (not implemented)
 * 2 json api
 */
const output_type = 2;
const testmode = 1;
const numres = 3;

// 最低精准度
// const minSimilarity = 40;
const group_info = new Map();

function search(data, bot) {
  const { user_id, group_id, raw_message, reply } = data;

  !group_info.has(group_id) && group_info.set(group_id, []);

  const user_info = group_info.get(group_id);

  switch (true) {
    case !key:
      reply(`你没有添加 apikey ，saucenao 服务将无法使用`);
      break;

    case !user_info.includes(user_id):
      user_info.push(user_id);
      reply(`请发送你要搜索的图片 (●'◡'●)`);

      function send(data) {
        if (data.group_id === group_id && data.user_id === user_id) {
          if (data.raw_message === raw_message) {
            reply('图呢？你他喵的倒是发呀 (╯°□°）╯︵ ┻━┻');
          } else if (/CQ:image/.test(data.raw_message)) {
            // 获取图片地址
            const image_url = data.raw_message.match(/(?<=url=).*(?=\])/g);
            // 官方示例
            // https://saucenao.com/search.php?db=999&output_type=2&testmode=1&numres=16&url=http%3A%2F%2Fcom%2Fimages%2Fstatic%2Fbanner.gif
            const params = `?db=${db}&output_type=${output_type}&testmode=${testmode}&numres=${numres}&api_key=${key}&url=${image_url}`;

            httpsRequest.get(url, params)
              .then(data => {
                const search = data.results.map(results => {
                  const { header: { similarity, thumbnail, index_name }, data } = results;

                  return `平台：${index_name.match(/(?<=: ).*(?=\ -)/g)}
封面：[CQ:image,file=${thumbnail}]
相似：${similarity}%
${data.ext_urls ? `地址：${data.ext_urls.join('\n')}` : `日文：${data.jp_name}\n英语：${data.eng_name}`}\n`;
                });

                reply(search.join('\n'));
                user_info.splice(user_info.findIndex(item => item === user_id), 1);
                bot.off("message.group", send);
                clearTimeout(timeout);
              })
              .catch(err => {
                reply(err ? `${err.message} 请重新发送图片` : `Timeout 请重新发送图片`);
              })
          }
        }
      }

      // 自动结束
      const timeout = setTimeout(() => {
        user_info.splice(user_info.findIndex(item => item === user_id), 1);
        bot.off("message.group", send);
      }, 180000);

      // 开启消息监听
      bot.on('message.group', send);
      break;
  }
}

function listener(data) {
  const action = checkCommand('saucenao', data, this);

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