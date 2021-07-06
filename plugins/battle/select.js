const { httpsRequest } = require('../../dist/util');

// 分数线
function score(data, bot) {
  const { group_id, reply } = data;
  const { groups } = bot;
  const { battle: { version } } = groups[group_id].settings;

  if (version !== 'bl') {
    reply(`该功能仅支持国服，${(version === 'jp' ? '日' : '台')}}服没有相关接口，如果有可以联系我添加`);
    return;
  }

  httpsRequest.get('https://tools-wiki.biligame.com/pcr/getTableInfo?type=subsection')
    .then((res) => {
      let msg = '';
      for (const item of JSON.parse(res)) {
        msg += `排名：${item.rank}\n公会：${item.clan_name}\n分数：${item.damage}\n---------------\n`;
      }
      msg ?
        reply(msg) :
        reply('当月未进行会战，无法获取分数线数据')
        ;
    })
    .catch((err) => {
      reply(err)
    })
}

// 排名
function rank(data, bot) {
  const { group_id, raw_message, reply } = data;
  const [, name, leader] = raw_message.split(' ');

  const { groups } = bot;
  const { battle: { version } } = groups[group_id].settings;

  if (version !== 'bl') {
    reply(`该功能仅支持国服，${(version === 'jp' ? '日' : '台')}}服没有相关接口，如果有可以联系我添加`);
    return;
  }

  httpsRequest.get(`https://tools-wiki.biligame.com/pcr/getTableInfo?type=search&search=${name}&page=0`)
    .then((res) => {
      let msg = '';
      const raw_data = JSON.parse(res);
      if (leader) {
        for (const item of raw_data) {
          const { rank, clan_name, leader_name, damage } = item;
          if (leader_name === leader) {
            msg += `排名：${rank}\n公会：${clan_name}\n会长：${leader_name}\n分数：${damage}\n---------------\n`;
          }
        }
      } else {
        for (let i = 0; i < 3; i++) {
          const { rank, clan_name, leader_name, damage } = raw_data[i];

          msg += `排名：${rank}\n公会：${clan_name}\n会长：${leader_name}\n分数：${damage}\n---------------\n`;
        }
        msg += '\n你未指定会长，以上为前 3 条同名公会数据'
      }
      msg ?
        reply(msg) :
        reply('会战已结束，无法获取数据')
        ;
    })
    .catch((err) => {
      reply(err)
    })
}

module.exports = {
  score, rank
}