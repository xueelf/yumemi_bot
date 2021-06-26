import { scheduleJob } from "node-schedule";
import { Client, GroupNoticeEventData, GroupPokeEventData, GroupTitleEventData, MemberDecreaseEventData, MemberIncreaseEventData } from "oicq";
import { IInfo } from "../../types/bot";
const { emoji } = path;
const word_poke = [
  '喵？',
  '别摸了！要秃了!',
  '呜...',
  '不可以！',
  'baka！别碰我！',
  '再摸拿剪刀了',
  `[CQ:image,file=${emoji}/poke.jpg]`,
  `[CQ:image,file=${emoji}/poke_hana.jpg]`,
  `[CQ:image,file=${emoji}/poke_hana.png]`,
  `[CQ:image,file=${emoji}/heng.png]`,
];

const word: Map<number, Set<string>> = new Map();

// 12小时清空一次
scheduleJob('0 0 12 * * ?', () => word.clear());

function poke(bot: Client, data: GroupNoticeEventData) {
  const { uin } = bot;
  const { group_id, user_id } = <GroupPokeEventData>data;

  if (user_id === uin) {
    // 不存在群信息则记录
    !word.has(group_id) && word.set(group_id, new Set());

    const msg = word_poke[Math.floor(Math.random() * word_poke.length)];

    if (word.get(group_id)?.has(msg)) {
      return;
    }

    bot.sendGroupMsg(group_id, msg)
    word.get(group_id)?.add(msg);
  }
}

function increase(bot: Client, data: GroupNoticeEventData) {
  const { uin } = bot;
  const { user_id, group_id } = <MemberIncreaseEventData>data;

  const { admin, docs } = <IInfo>yumemi.info;

  bot.sendGroupMsg(group_id,
    user_id !== uin ?
      `欢迎新人 [CQ:at,qq=${user_id}] 的加入~\n新人麻烦爆照报三围，希望你不要不识抬举（\n[CQ:image,file=${emoji}/miyane.jpg]` :
      (
        !admin.includes(user_id) ?
          `泥豪，这里是只人畜无害的人工智障~\n本群服务默认关闭，若要开启麻烦联系 yuki 或项目负责人\n使用手册请访问：${docs}` :
          `欢迎新...yuki 你怎么来了？`
      )
  );
}

function decrease(bot: Client, data: GroupNoticeEventData) {
  const { operator_id, group_id, user_id, member } = <MemberDecreaseEventData>data;

  // 判断是否人为操作
  operator_id !== user_id ?
    bot.sendGroupMsg(group_id, `感谢 [CQ:at,qq=${operator_id}] 赠送给 ${member?.nickname}（${member?.user_id}） 的一张飞机票~\n[CQ:image,file=${emoji}/mizu.jpg]`) :
    bot.sendGroupMsg(group_id, `成员 ${member?.nickname}（${member?.user_id}） 已退出群聊\n[CQ:image,file=${emoji}/chi.jpg]`)
    ;
}

function title(bot: Client, data: GroupTitleEventData) {
  const { group_id, user_id } = data;

  bot.sendGroupMsg(group_id, `[CQ:at,qq=${user_id}] 头衔已变更`);
}

function greet(bot: Client, data: GroupNoticeEventData): void {
  const { groups } = bot;
  const { group_id } = data;

  if (!groups[group_id].plugins.includes('greet')) {
    return
  }

  switch (data.sub_type) {
    case 'poke':
      poke(bot, data)
      break;

    case 'increase':
      increase(bot, data)
      break;

    case 'increase':
      decrease(bot, data)
      break;
  }
}

function activate(bot: Client): void {
  bot.on("notice.group", (data: GroupNoticeEventData) => greet(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("notice.group", greet);
}

export {
  activate, deactivate
}