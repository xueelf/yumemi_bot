const { getConfig, scheduleJob } = require('../../utils/util');

const poke = [
  '喵？',
  '别摸了！要秃了!',
  '呜...',
  '不可以！',
  'baka！别碰我！',
  '再摸拿剪刀了',
  `[CQ:image,file=./data/images/emoji/poke.jpg]`,
  `[CQ:image,file=./data/images/emoji/poke_hana.jpg]`,
  `[CQ:image,file=./data/images/emoji/poke_hana.png]`,
  `[CQ:image,file=./data/images/emoji/heng.jpg]`,
]

const word = new Map();

// 12小时清空一次
scheduleJob('0 0 12 * * ?', () => word.clear());

module.exports = data => {
  const { sub_type, user_id, group_id, operator_id, member } = data;

  switch (sub_type) {
    // 戳一戳事件
    case 'poke':
      if (user_id === bot.uin) {
        // 不存在群信息则记录
        !word.has(group_id) && word.set(group_id, new Set());

        const msg = poke[Math.floor(Math.random() * poke.length)];

        if (word.get(group_id).has(msg)) return;

        bot.sendGroupMsg(group_id, msg);
        word.get(group_id).add(msg);
      }
      break;

    // 群员增加事件
    case 'increase':
      getConfig('bot').then(data => {
        const { qq: { admin }, info: { docs } } = data;
        bot.sendGroupMsg(group_id,
          user_id !== bot.uin ?
            `欢迎新人 [CQ:at,qq=${user_id}] 的加入~\n新人麻烦爆照报三围，希望你不要不识抬举（\n[CQ:image,file=./yumemi/data/images/emoji/miyane.jpg]` :
            (
              user_id !== admin ?
                `泥豪，这里是只人畜无害的人工智障~\n本群服务默认关闭，若要开启麻烦联系 yuki 或项目负责人\n使用手册请访问：${docs}` :
                `欢迎新...yuki 你怎么来了？`
            )
        );
      })

      break;

    // 群员减少事件
    case 'decrease':
      // 判断是否人为操作
      operator_id !== user_id ?
        bot.sendGroupMsg(group_id, `感谢 [CQ:at,qq=${operator_id}] 赠送给 ${member.nickname}（${member.user_id}） 的一张飞机票~\n[CQ:image,file=./yumemi/data/images/emoji/mizu.jpg]`) :
        bot.sendGroupMsg(group_id, `成员 ${member.nickname}（${member.user_id}） 已退出群聊\n[CQ:image,file=./yumemi/data/images/emoji/chi.jpg]`)
        ;
      break;

    // 头衔变更事件
    case 'title':
      bot.sendGroupMsg(group_id, `[CQ:at,qq=${user_id}] 头衔已变更`);
      break;

    // 群撤回事件
    // case 'recall':
    // 防撤回过于阴间，该功能已被封印
    // 	break;

    // 管理变更事件
    // case 'admin':

    // 	break;
    // 小黑屋事件
    // case 'ban':

    // 	break;
  }
}