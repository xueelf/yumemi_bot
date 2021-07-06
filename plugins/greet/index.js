const { scheduleJob } = require('node-schedule');

const word = [
  '喵？',
  '别摸了！要秃了!',
  '呜...',
  '不可以！',
  'baka！别碰我！',
  '再摸拿剪刀了',
  `[CQ:image,file=./data/images/emoji/poke.jpg]`,
  `[CQ:image,file=./data/images/emoji/poke_hana.jpg]`,
  `[CQ:image,file=./data/images/emoji/poke_hana.png]`,
  `[CQ:image,file=./data/images/emoji/heng.png]`,
];
const poke_info = new Map();

// 12小时清空一次
scheduleJob('0 0 12 * * ?', () => poke_info.clear());

function poke(data, bot) {
  const { uin } = bot;
  const { group_id, user_id } = data;

  if (user_id !== uin) return

  // 不存在群信息则记录
  !poke_info.has(group_id) && poke_info.set(group_id, new Set());

  const msg = word[Math.floor(Math.random() * word.length)];

  if (poke_info.get(group_id).has(msg)) {
    return;
  }

  bot.sendGroupMsg(group_id, msg)
  poke_info.get(group_id).add(msg);
}

function increase(data, bot) {
  const { uin } = bot;
  const { user_id, group_id } = data;

  const { admin, docs } = global.yumemi.info;

  bot.sendGroupMsg(group_id,
    user_id !== uin ?
      (!admin.includes(user_id) ?
        `欢迎新人 [CQ:at,qq=${user_id}] 的加入~\n新人麻烦爆照报三围，希望你不要不识抬举（\n[CQ:image,file=./data/images/emoji/miyane.jpg]` :
        `欢迎新...yuki 你怎么来了？`
      ) :
      `泥豪，这里是只人畜无害的人工智障~\n群服务默认关闭，若要开启麻烦联系 yuki 或项目负责人\n使用手册请访问：${docs}`
  );
}

function decrease(data, bot) {
  const { operator_id, group_id, user_id, member } = data;

  // 判断是否人为操作
  operator_id !== user_id ?
    bot.sendGroupMsg(group_id, `感谢 [CQ:at,qq=${operator_id}] 赠送给 ${member.nickname}（${member.user_id}） 的一张飞机票~\n[CQ:image,file=./data/images/emoji/mizu.jpg]`) :
    bot.sendGroupMsg(group_id, `成员 ${member.nickname}（${member.user_id}） 已退出群聊\n[CQ:image,file=./data/images/emoji/chi.jpg]`)
    ;
}

// function title(data, bot) {
//   const { group_id, user_id, reply } = data;

//   reply(`[CQ:at,qq=${user_id}] 头衔已变更`);
// }

function listener(data) {
  const { sub_type } = data;

  switch (sub_type) {
    case 'poke':
      poke(data, this);
      break;

    case 'increase':
      increase(data, this);
      break;

    case 'decrease':
      decrease(data, this);
      break;

    // oicq 移除了头衔变更事件
    // case 'title':
    //   title(data, this);
    //   break;
  }
}

function activate(bot) {
  bot.on('notice.group', listener);
}

function deactivate(bot) {
  bot.off('notice.group', listener);
}

module.exports = {
  activate, deactivate
}