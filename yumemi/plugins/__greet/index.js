const poke = [
  '喵？',
  '那...那里是...',
  '呜...',
  '不可以！',
  'baka！别碰我！'
]
// const word = new Set();
const word = new Map();

// 12小时清空一次
tools.scheduleJob('0 0 12 * * ?', () => word.forEach(values => values.clear()));

module.exports = data => {
  const { sub_type, user_id, group_id, operator_id, member } = data;
  switch (sub_type) {
    // 戳一戳
    case 'poke':
      if (user_id === bot.uin) {
        if (!word.has(group_id)) word.set(group_id, new Set());
        const msg = poke[Math.floor(Math.random() * poke.length)];
        if (word.get(group_id).has(msg)) return;
        bot.sendGroupMsg(group_id, msg);
        word.get(group_id).add(msg);
      }
      break;

    // 群员增加
    case 'increase':
      bot.sendGroupMsg(group_id,
        user_id !== bot.uin ?
          `欢迎新人 [CQ:at,qq=${user_id}] 的加入~\n新人麻烦爆照报三围，希望你不要不识抬举（\n[CQ:image,file=./yumemi/data/images/emoji/miyane.jpg]` :
          (
            user_id !== admin ?
              `泥豪，这里是只人畜无害的人工智障~\n本群服务默认关闭，若要开启麻烦联系 yuki\n使用手册请访问：${tools.getYAML('bot').info.docs}` :
              `欢迎新...yuki？！你怎么来了`
          )
      );

      break;

    // 群员减少
    case 'decrease':
      // 判断是否人为操作
      operator_id !== user_id ?
        bot.sendGroupMsg(group_id, `感谢 [CQ:at,qq=${operator_id}] 赠送给 ${member.nickname}（${member.user_id}） 的一张飞机票~\n[CQ:image,file=./yumemi/data/images/emoji/mizu.jpg]`) :
        bot.sendGroupMsg(group_id, `成员 ${member.nickname}（${member.user_id}） 已退出群聊\n[CQ:image,file=./yumemi/data/images/emoji/chi.jpg]`)
        ;
      break;

    // 头衔变更
    case 'title':
      bot.sendGroupMsg(group_id, `[CQ:at,qq=${user_id}] 头衔已变更`);
      break;

    // 防撤回
    // case 'recall':

    // 	break;

    // 管理变更
    // case 'admin':

    // 	break;
    // 小黑屋
    // case 'ban':

    // 	break;
  }

}