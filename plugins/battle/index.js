const { checkBattle } = require('./create');
const { rank, score } = require('./select');
const querystring = require('querystring');
const { checkCommand, getProfileSync, getLevel, httpRequest } = require('../../dist/util');

const boss = getProfileSync('boss');
const battle_url = `http://localhost/api/battle`;
const cn_char = ['零', '一', '二', '三', '四', '五'];
const en_char = ['zero', 'one', 'two', 'three', 'four', 'five'];

// 数字添加0
function addZero(number) {
  return number < 10 ? '0' + number : number.toString();
}

// 获取当前时间
function getDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = addZero(date.getMonth() + 1);
  const day = addZero(date.getDate());
  const morrow = addZero(date.getDate() + 1);
  const hour = addZero(date.getHours());
  const minute = addZero(date.getMinutes());
  const seconds = addZero(date.getSeconds());

  const time = `${year}-${month}-${day} ${hour}:${minute}:${seconds}`;
  const today = `${year}-${month}-${day} 05`;
  const tomorrow = `${year}-${month}-${morrow} 05`;
  const the_month = `${year}-${month}`;
  const next_month = `${year}-${addZero(date.getMonth() + 2)}`;

  return { time, today, tomorrow, the_month, next_month }
}

// 获取当前阶段 boss 的 max 血量
function getMaxBlood(version, syuume) {
  /**
   * 一阶段  1 ~  3
   * 二阶段  4 ~ 10
   * 三阶段 11 ~ 34
   * 四阶段 35 ~ 44
   * 五阶段 45 ~ 
   */
  const stage = syuume <= 3 ? 1 : (syuume <= 10 ? 2 : syuume <= 34 ? 3 : syuume <= 44 ? 4 : 5);

  return boss[version][stage - 1];
}

// 获取当天会战数据
function getBattle(data) {
  return new Promise(async (resolve, reject) => {
    const { group_id } = data;
    const { today, tomorrow, the_month, next_month } = getDate();

    const params = querystring.stringify({
      data: [today, tomorrow, group_id, the_month, next_month]
    });

    httpRequest.post(`${battle_url}/get_now_battle`, params)
      .then((res) => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      })
  })
}

// 初始化公会信息
async function initGuild(data, bot) {
  await checkBattle(data);

  const update = require('../_terminal/update');
  const { groups } = bot;
  const { group_id, raw_message, reply } = data;
  const { battle: { version } } = groups[group_id].settings;

  const guild = raw_message.slice(2, 4);

  getBattle(data)
    .then(res => {
      let new_version = null;

      switch (guild) {
        case '国服':
          new_version = 'bl';
          break;

        case '台服':
          new_version = 'tw';
          break;

        case '日服':
          new_version = 'jp';
          break;
      }

      if (version === new_version) {
        reply(`当前群聊已设置 ${guild} 公会，请不要重复修改`);
        return;
      }
      // 未做会战是否结束的时间判断，待优化
      if (res.id) {
        reply('当月已开启会战，请不要在中途修改游戏服务器');
        return;
      }

      data.raw_message = `>update battle version ${new_version}`;
      update(data, bot);
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 开启会战
async function insertBattle(data, bot) {
  await checkBattle(data);

  const { groups } = bot;
  const { group_id, reply } = data;
  const { battle: { version } } = groups[group_id].settings;

  const level = await getLevel(data, bot);

  if (level < 3) return reply(`你当前为 Level ${level}，开启会战需要达到 Level 3 ，权限不足`);

  const battle = await getBattle(data);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (battle.id) return reply('当月已开启会战，请勿重提提交');

  const { time } = getDate();
  const { raw_message } = data;
  // 当期星座
  const title = raw_message.slice(2, 5);
  // 获取 boss 血量
  const [one, two, three, four, five] = await getMaxBlood(version, 1);
  // 会战预约信息
  const crusade = '{\n  "one":[],\n  "two":[],\n  "three":[],\n  "four":[],\n  "five":[]\n}';
  const params = querystring.stringify({
    data: [group_id, title, one, two, three, four, five, crusade]
  });

  // 写入会战数据
  httpRequest.post(`${battle_url}/set_battle`, params)
    .then(() => {
      // 发送会战数据
      let msg = `${version === 'tw' ? '台' : (version === 'jp' ? '日' : '国')}服会战：`;
      // 是否是新版会战
      const isNewBattle = version !== 'jp' ? false : true;

      if (!isNewBattle) {
        const max_blood = eval(`${en_char[1]}`)

        msg += `\n　　1 周目 1 阶段 1 王\n剩余血量：\n　　${max_blood} / ${max_blood}\n讨伐成员：\n　　暂无\n`;
        msg += `出刀信息：\n　　0 / 90\n更新时间：\n　　${time}`;
      } else {
        for (let i = 1; i <= 5; i++) {
          const max_blood = eval(`${en_char[i]}`)

          msg += `\n\t${cn_char[i]}王：${max_blood} / ${max_blood}\n\t讨伐：暂无\n`;
        }
        msg += `会战进度：\n\t1 周目 1 阶段 0 / 90 已出\n更新时间：\n\t${time}`;
      }
      reply(msg)
      bot.logger.info(`INSERT battle succrss: ${group_id}`);
    })
    .catch(err => {
      reply(err)
      bot.logger.error(err);
    })
}

// 中止会战
async function deleteBattle(data, bot) {
  await checkBattle(data);

  const { groups } = bot;
  const { group_id, reply } = data;
  const { battle: { version } } = groups[group_id].settings;

  const level = await getLevel(data, bot);

  if (level < 3) return reply(`你当前为 Level ${level}，中止会战需要达到 Level 3 ，权限不足`);

  const battle = await getBattle(data);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.id) return reply('当月未发起会战，请先初始化数据');

  const { the_month, next_month } = getDate();
  const params = querystring.stringify({
    data: [group_id, the_month, next_month]
  });

  httpRequest.post(`${battle_url}/delete_battle`, params)
    .then(() => {
      reply('当月会战已中止，所有数据清空完毕');
    })
    .catch(err => {
      reply(err);
      bot.logger.error(err);
    })
}

// 当前状态
async function selectBattle(data, bot) {
  await checkBattle(data);

  const { groups } = bot;
  const { group_id, reply } = data;
  const { battle: { version } } = groups[group_id].settings;
  const battle = await getBattle(data);

  if (version === 'none') {
    reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
    return
  }
  if (!battle.id) {
    reply('当月未发起会战，请先初始化数据');
    return;
  }

  const { title, syuume, one, two, three, four, five, crusade, length, update_time } = battle;
  // 获取 boss 血量
  const max_blood = await getMaxBlood(version, syuume);
  // 格式化 crusade
  const crusade_json = JSON.parse(crusade);

  let msg = `${version === 'tw' ? '台' : (version === 'jp' ? '日' : '国')}服会战：`;
  // 是否是新版会战
  const isNewBattle = version !== 'jp' ? false : true;

  if (!isNewBattle) {
    for (let i = 1; i <= 5; i++) {
      const blood = eval(`${en_char[i]}`)
      if (blood === 0) continue

      const crusade_member = crusade_json[en_char[i]];
      const title = [`\n　　${syuume} 周目 ${syuume <= 3 ? 1 : (syuume <= 10 ? 2 : syuume <= 34 ? 3 : 4)} 阶段 ${i} 王`, `讨伐成员`];

      // 如果有人网名里带 @ 会导致字段丢失，待优化（谁他喵的用 @ 当网名啊喂
      msg += `${title[0]}\n剩余血量：\n　　${blood} / ${max_blood[i - 1]}\n${title[1]}：\n　　${crusade_member.length ? crusade_member.map(item => item.split('@')[0]).join(', ') : `暂无`}\n`;
      if (blood !== 0) break
    }

    msg += `出刀信息：\n　　${length} / 90\n更新时间：\n　　${update_time}`;
  } else {
    for (let i = 1; i <= 5; i++) {
      const blood = eval(`${en_char[i]}`)
      const crusade_member = crusade_json[en_char[i]];
      const title = blood ? [`${cn_char[i]}王`, `讨伐`] : [`扑街`, `预约`];

      // 如果有人网名里带 @ 会导致字段丢失，待优化（谁他喵的用 @ 当网名啊喂
      msg += `\n\t${title[0]}：${blood} / ${max_blood[i - 1]}\n\t${title[1]}：${crusade_member.length ? crusade_member.map(item => item.split('@')[0]).join(', ') : `暂无`}\n`;
    }

    msg += `会战进度：\n\t${syuume} 周目 ${syuume <= 3 ? 1 : (syuume <= 10 ? 2 : syuume <= 34 ? 3 : 4)} 阶段 ${length} / 90 出刀\n更新时间：\n\t${update_time}`;
  }
  reply(msg);
}

// 查刀
async function selectBeat(data, bot) {
  await checkBattle(data);

  const { groups } = bot;
  const { group_id, reply } = data;
  const { battle: { version } } = groups[group_id].settings;
  const battle = await getBattle(data);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.id) return reply('当月未发起会战，请先初始化数据');

  const { today, tomorrow } = getDate();
  const { user_id, nickname, card } = data.sender;
  const params = querystring.stringify({
    data: [group_id, user_id, today, tomorrow]
  });

  httpRequest.post(`${battle_url}/get_now_beat`, params)
    .then(res => {
      const { length } = res;
      let msg = `▼ ${card ? card : nickname} ${length ? (`${res[0].number < 3 ? `还有 ${3 - res[0].number} 刀未出` : '已出完三刀'}`) : '今日未出刀'}\n`;

      for (let i = 0; i < length; i++) {
        msg += `\n${res[i].fight_time}：\n　　(${res[i].number}) 对 ${res[i].boss} 王造成了 ${res[i].damage} 点伤害`;
      }
      msg += `${length < 1 ? `\n暂无数据` : ``}`;
      reply(msg);
    })
    .catch(err => {
      reply(err.message);
      bot.logger.error(err);
    })
}

// 代报
async function replace(data, bot) {
  await checkBattle(data);

  const { groups } = bot;
  const { group_id, reply } = data;
  const { battle: { version } } = groups[group_id].settings;
  const battle = await getBattle(data);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.id) return reply('当月未发起会战，请先初始化数据');

  const { user_id, raw_message } = data;
  const [replace_id, replace_name, replace_message] = raw_message.match(/(?<=qq=)\d+|(?<=text=@).+(?=\])|(?<=\]).*/g);

  if (replace_id === user_id) {
    reply(`[CQ:at,qq=${user_id}] 不能自己跟自己代报 (╯▔皿▔)╯`);
    return;
  }

  const boss = Number(replace_message.match(/\d(?=\s?\u4EE3\u62A5)/g));
  const damage = Number(replace_message.match(/(?<=\u4EE3\u62A5\s?)\d+/g));
  // const damage_info = replace_message.match(/\d(?=\s?\u4EE3\u62A5)|(?<=\u4EE3\u62A5\s?)\d+/g);

  data.sender = {
    user_id: replace_id,
    nickname: replace_name,
    card: '',
    sex: "unknown",
    age: 0,
    area: '',
    level: 0,
    role: 'member',
    title: ''
  };
  data.user_id = replace_id;
  data.raw_message = `${boss ? boss : ``} ${damage ? `报刀 ${damage}` : `尾刀`}`;

  insertBeat(data, bot);
}

// 报刀
async function insertBeat(data, bot) {
  await checkBattle(data);

  const { groups } = bot;
  const { group_id, raw_message, reply } = data;
  const { battle: { version } } = groups[group_id].settings;
  const battle = await getBattle(data);

  if (version === 'none') {
    reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
    return;
  };
  if (!battle.id) {
    reply('当月未发起会战，请先初始化数据');
    return;
  }
  if (/^\d/.test(raw_message) && version !== 'jp') {
    reply(`当前群聊设置的是 ${version === 'tw' ? '台' : '国'}服 公会，无法指定 boss 报刀`);
    return;
  }

  // 当天是否已出刀
  // SELECT * FROM beat WHERE group_id = ? AND user_id = ? AND fight_time REGEXP '${year}-${month}-(${day}\s[0-2]\d|${day+1}\s0[0-4])' ORDER BY fight_time DESC
  const { user_id } = data;
  const { today, tomorrow } = getDate();
  const params = querystring.stringify({
    data: [group_id, user_id, today, tomorrow]
  });

  httpRequest.post(`${battle_url}/get_now_beat`, params)
    .then(res => {
      const { nickname, card } = data.sender;
      // 判断当日已出多少刀
      const number_sum = res.length ? res[0].number : 0;

      if (number_sum === 3) return reply(`${card ? card : nickname} 今天已经出完3刀了，请不要重复提交数据`);

      const { one, two, three, four, five } = battle;
      const damage = Number(raw_message.match(/(?<=报刀).*/g));

      let all_blood = [one, two, three, four, five];
      let boss = Number(raw_message.match(/\d\s?(?=(报刀|尾刀))/g));

      // 未指定 boss 则选取存活的第一个 boss
      if (!boss) {
        for (let i = 0; i < 5; i++) {
          if (all_blood[i] > 0) {
            boss = i + 1;
            break;
          }
        }
      }

      // boss 血量为空
      if (!all_blood[boss - 1]) return reply(`[CQ:at,qq=${user_id}] ${cn_char[boss]}王 都没了，你报啥呢？`);

      // 伤害溢出
      if (damage && damage >= all_blood[boss - 1]) return reply(`伤害值超出 boss 剩余血量，若以斩杀 boss 请使用「尾刀」指令`);

      const { id, syuume, crusade } = battle;
      const note = `${card ? card : nickname} 对 ${cn_char[boss]}王 造成了 ${damage ? `${damage} 点伤害` : `${all_blood[boss - 1]} 点伤害并击破`}`;
      const params = querystring.stringify({
        data: [id, group_id, user_id, damage ? parseInt(number_sum) + 1 : number_sum + 0.5, syuume, boss, damage ? damage : all_blood[boss - 1], note]
      });

      // 插入 beat 数据
      httpRequest.post(`${battle_url}/set_beat`, params)
        .then(async () => {
          let next = 0;
          for (let i = 0; i < 5; i++) all_blood[i] === 0 && next++;

          // 如果数组出现4次0而且是尾刀则进入下一周目
          if (next === 4 && !damage) {
            const max_blood = await getMaxBlood(version, syuume);
            all_blood = [...max_blood];
            next++
          } else {
            // 修改血量
            all_blood[boss - 1] = damage ? all_blood[boss - 1] - damage : 0;
          }

          const crusade_json = JSON.parse(crusade);
          const crusade_set = new Set(crusade_json[en_char[boss]]);
          const crusade_member = `${card ? card : nickname}@${user_id}`;

          // 若不是日服则 at 预约成员
          if (!damage && version !== 'jp' && crusade_json[en_char[boss < 5 ? boss + 1 : 1]].length) {
            let msg = '';
            for (const member of crusade_json[en_char[boss < 5 ? boss + 1 : 1]]) {
              const [, user_id] = member.split('@');
              msg += `[CQ:at,qq=${user_id}]`
            }
            msg += `到${cn_char[boss < 5 ? boss + 1 : 1]}王啦~`
            reply(msg);
          }

          // 清空讨伐数据
          crusade_set.has(crusade_member) && crusade_set.delete(crusade_member)
          crusade_json[en_char[boss]] = damage ? [...crusade_set] : [];



          reply(`${note}${next < 5 ? '' : `\n所有 boss 已被斩杀，开始进入 ${syuume + 1} 周目`}`);

          // 更新 battle
          updateBattle(
            data,
            bot,
            next < 5 ? syuume : syuume + 1,
            all_blood,
            JSON.stringify(crusade_json, null, 2)
          );
        })
        .catch(err => {
          reply(err);
          bot.logger.error(err);
        })
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 撤销出刀
async function deleteBeat(data, bot) {
  await checkBattle(data);

  const { groups } = bot;
  const { group_id, reply } = data;
  const { battle: { version } } = groups[group_id].settings;
  const battle = await getBattle(data);

  if (version === 'none') {
    reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
    return
  }
  if (!battle.id) {
    reply('当月未发起会战，请先初始化数据');
    return
  }
  const { user_id } = data;
  const { today, tomorrow } = getDate();

  const params = querystring.stringify({
    data: [group_id, user_id, today, tomorrow]
  });
  httpRequest.post(`${battle_url}/get_now_beat`, params)
    .then((res) => {
      const { nickname, card } = data.sender;

      if (!res.length) {
        reply(`${card ? card : nickname} 今天没有出刀信息`);
        return;
      }

      const params = querystring.stringify({
        data: [group_id, user_id, res[0].number, today, tomorrow]
      });

      httpRequest.post(`${battle_url}/delete_beat`, params)
        .then(() => {
          reply('已撤销出刀信息')
        })
        .catch((err) => {
          reply(err)
        })
    })
}

// 修改出刀
// async function updateBeat(bot: Client, data: GroupMessageEventData) {
//   await checkBattle(data);

//   const { groups } = bot;
//   const { group_id, reply } = data;
//   const { battle: { version } } = groups[group_id].settings;
//   const battle = await getBattle(data);

//   if (version === 'none') {
//     reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
//     return
//   }
//   if (!battle.id) {
//     reply('当月未发起会战，请先初始化数据');
//     return
//   }

//   const { today, tomorrow } = getDate();
//   const { user_id, raw_message } = data;
//   // 当天是否已出刀
//   const params = querystring.stringify({
//     data: [group_id, user_id, today, tomorrow] as string[]
//   });

//   httpRequest.post(`${battle_url}/get_now_beat`, params)
//     .then((res: any[]) => {
//       const update_info = raw_message.match(/\d(\.5)?(?=\s?修改)|(?<=修改\s?)\d+/g)?.map(Number);
//       const [number, damage] = <number[]>update_info;
//       const beat_info = res.find((item: any) => item.number === number)

//       const { sender: { nickname, card } } = data;

//       if (!beat_info) {
//         reply(`${card ? card : nickname} 没有第 ${number} 刀的出刀信息`);
//         return;

//       }

//       if (res[res.length - 1].number !== number) {
//         reply(`${card ? card : nickname} 已出 ${res[res.length - 1].number} 刀，只能修改最后一刀的信息`);
//         return;
//       }

//       // 如果是国服且 boss 被其他成员报刀

//       let isChange = false;

//       // 修改 battle 信息
//       const { boss } = beat_info;
//       const { syuume, one, two, three, four, five, crusade } = battle;
//       const all_blood = [one, two, three, four, five];

//       if (all_blood[boss - 1] === 0 || all_blood[boss - 1] + (beat_info.damage - damage) === 0) {
//         isChange = true;
//       }

//       // 修改血量
//       all_blood[boss - 1] = all_blood[boss - 1] + (beat_info.damage - damage);

//       if (all_blood[boss - 1] < 0) {
//         reply('修改后 boss 血量将会低于 0 ，请输入正确的数值');
//         return
//       }

//       const params = querystring.stringify({
//         data: [
//           !isChange ? number : (all_blood[boss - 1] > 0 ? number + 0.5 : Math.ceil(number) - 0.5),
//           damage,
//           user_id,
//           number,
//           today,
//           tomorrow
//         ] as string[]
//       });

//       httpRequest.post(`${battle_url}/update_beat`, params)
//         .then(() => {
//           reply(`修改成功`);

//           updateBattle(
//             data,
//             bot,
//             syuume,
//             all_blood,
//             crusade
//           );
//         })
//         .catch(err => {
//           reply(err);
//           bot.logger.error(err);
//         })
//     })
//     .catch(err => {
//       reply(err);
//       bot.logger.error(err);
//     })
// }

// 修改 boss 信息
async function updateBossInfo(data, bot) {
  await checkBattle(data);

  const { groups } = bot;
  const { group_id, raw_message, reply } = data;
  const { battle: { version } } = groups[group_id].settings;
  const battle = await getBattle(data);

  if (version === 'none') {
    reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
    return;
  };
  if (!battle.id) {
    reply('当月未发起会战，请先初始化数据');
    return;
  }

  const new_data = { syuume: '周目', boss: 'boss', blood: '血量' }

  for (const item in new_data) {
    const index = raw_message.indexOf(new_data[item]);

    new_data[item] = index === -1 ? null : parseInt(raw_message.slice(index + new_data[item].length));
  }

  const syuume = !new_data.syuume ? battle.syuume : new_data.syuume;

  let all_blood = [];

  // 修改血量
  if (new_data.boss && !new_data.blood) {
    const max_blood = getMaxBlood(version, syuume);
    // 未指定 boss 血量则设置满血
    new_data.blood = max_blood[new_data.boss - 1];
  } else if (!new_data.boss && new_data.blood) {
    reply('请指定需要修改血量的 boss')
    return
  }

  if (version !== 'jp') {
    all_blood = await getMaxBlood(version, 1);

    for (let i = 0; i < new_data.boss - 1; i++) {
      all_blood[i] = 0
    }

    all_blood[new_data.boss - 1] = new_data.blood;

  } else {
    const { one, two, three, four, five } = battle;
    all_blood = [one, two, three, four, five];

    all_blood[new_data.boss - 1] = new_data.blood;
  }

  updateBattle(
    data,
    bot,
    syuume,
    all_blood,
    battle.crusade
  );
}

// 更新 battle
function updateBattle(data, bot, syuume, all_blood, crusade) {
  const { group_id, reply } = data;
  const { time, the_month, next_month } = getDate();
  const [one, two, three, four, five] = all_blood;

  const params = querystring.stringify({
    data: [syuume, one, two, three, four, five, crusade, time, group_id, the_month, next_month]
  });

  httpRequest.post(`${battle_url}/update_battle`, params)
    .then(() => {
      selectBattle(data, bot);
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 预约
async function reservation(data, bot) {
  await checkBattle(data);

  const { groups } = bot;
  const { group_id, reply } = data;
  const { battle: { version } } = groups[group_id].settings;
  const battle = await getBattle(data);

  if (version === 'none') {
    reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
    return;
  }
  if (!battle.id) {
    reply('当月未发起会战，请先初始化数据');
    return;
  }

  const { crusade } = battle;
  const { raw_message, user_id, sender: { nickname, card } } = data;

  const crusade_json = JSON.parse(crusade);
  const crusade_member = `${card ? card : nickname}@${user_id}`;
  const boss = raw_message.length > 2 ? Number(raw_message.slice(2).trim()) : null;

  // boss 传入实参则插入预约信息
  if (boss) {
    // 如果预约后改网名这里可能会有问题，未测试过，直觉告诉我待优化
    if (crusade_json[en_char[boss]].indexOf(`${crusade_member}`) !== -1) {
      reply(`[CQ:at,qq=${user_id}] 你已预约 ${cn_char[boss]}王，请勿重复预约`);
      return;
    }

    const { time, the_month, next_month } = getDate();
    crusade_json[en_char[boss]].push(crusade_member);

    const params = querystring.stringify({
      data: [JSON.stringify(crusade_json, null, 2), time, group_id, the_month, next_month]
    });

    httpRequest.post(`${battle_url}/reservation`, params)
      .then(() => {
        reply(`${card ? card : nickname} 预约 ${cn_char[boss]}王 成功`);
      })
      .catch(err => {
        reply(err.message);
        bot.logger.error(err);
      })
  }

  // 不传入 boss 实参则发送预约信息
  let msg = '';
  for (let i = 1; i <= 5; i++) {
    msg += `${cn_char[i]}王：\n　　${crusade_json[en_char[i]].length ? crusade_json[en_char[i]].map(item => item.split('@')[0]).join(', ') : '暂无'}\n`;
  }

  reply(msg);
}

// 取消预约
async function rescind(data, bot) {
  await checkBattle(data);

  const { groups } = bot;
  const { raw_message, group_id, reply } = data;
  const { battle: { version } } = groups[group_id].settings;
  const battle = await getBattle(data);

  if (version === 'none') {
    reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
    return;
  }
  if (!battle.id) {
    reply('当月未发起会战，请先初始化数据');
    return;
  }
  if (raw_message.length === 4) {
    reply('请指定需要取消预约的 boss');
    return;
  }

  const { crusade } = battle;
  const { user_id, sender: { nickname, card } } = data;

  const crusade_json = JSON.parse(crusade);
  const crusade_member = `${card ? card : nickname}@${user_id}`;
  const boss = Number(raw_message.slice(4).trim());
  const index = crusade_json[en_char[boss]].indexOf(`${crusade_member}`);
  if (index === -1) {
    reply(`[CQ:at,qq=${user_id}] 你没有预约 ${cn_char[boss]}王，无法取消预约`);
    return;
  } else {
    crusade_json[en_char[boss]].splice(index, 1);
  }

  const { time, the_month, next_month } = getDate();

  const params = querystring.stringify({
    data: [JSON.stringify(crusade_json, null, 2), time, group_id, the_month, next_month]
  });

  httpRequest.post(`${battle_url}/reservation`, params)
    .then(() => {
      reply(`${card ? card : nickname} 已取消预约 ${cn_char[boss]}王`);
    })
    .catch(err => {
      reply(err.message);
      bot.logger.error(err);
    })

  // 不传入 boss 实参则发送预约信息
  let msg = '';
  for (let i = 1; i <= 5; i++) {
    msg += `${cn_char[i]}王：\n　　${crusade_json[en_char[i]].length ? crusade_json[en_char[i]].map(item => item.split('@')[0]).join(', ') : '暂无'}\n`;
  }

  reply(msg);
}

function listener(data) {
  const action = checkCommand('battle', data, this);

  action && eval(`${action}(data, this)`);
}

function activate(bot) {
  bot.on("message.group", listener);
}

function deactivate(bot) {
  bot.off("message.group", listener);
}

module.exports = {
  activate, deactivate, battle_url
}