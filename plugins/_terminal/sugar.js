const update = require('./update');
const control = require('./control');

// 语法糖
module.exports = function sugar(data, bot) {
  let { raw_message } = data;

  const param = /(关闭|禁用)/.test(raw_message.slice(0, 2)) ? false : true;;
  const setting = raw_message.slice(2).trim();

  switch (setting) {
    case 'r18':
      data.raw_message = `>update setu r18 ${param}`;
      update(data, bot);
      break;

    case 'flash':
      data.raw_message = `>update setu flash ${param}`;
      update(data, bot);
      break;

    case 'pcr_bl':
    case 'pcr_jp':
      data.raw_message = `>update bilibili ${setting} ${param}`;
      update(data, bot);
      break;
    case '群服务':
      data.raw_message = `>${param ? 'enable' : 'disable'} all`;
      control(data, bot);
      break;

    default:
      data.raw_message = `>${param ? 'enable' : 'disable'} ${setting}`;
      control(data, bot);
      break;
  }
}