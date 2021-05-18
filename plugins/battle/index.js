const { resolve } = require('path');
const querystring = require('querystring');
const { getConfig, httpRequest } = require(`../../utils/util`);

const battle_url = `http://localhost/api/battle`;
const cn_char = ['零', '一', '二', '三', '四', '五'];
const en_char = ['zero', 'one', 'two', 'three', 'four', 'five'];

// 数字添加0
const addZero = number => number < 10 ? '0' + number : number;

// 获取当前时间
const getDate = () => {
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

// 获取当前 boss 的 max 血量
const getMaxBlood = async (version, syuume) => {
  const boss = await getConfig('boss');
  const stage = syuume <= 3 ? 1 : (syuume <= 10 ? 2 : syuume <= 34 ? 3 : 4);

  // 国服没有 4 阶段，数组下标 -1
  return boss[version][version === 'bl' && stage > 3 ? stage - 2 : stage - 1];
}

// 获取当天会战数据
const getBattle = ctx => {
  return new Promise(async (resolve, reject) => {
    const { group_id } = ctx;
    const { today, tomorrow, the_month, next_month } = getDate();
    const { [group_id]: { plugins: { battle: { version } } } } = await getConfig('groups')
    const params = querystring.stringify({
      params: [today, tomorrow, group_id, the_month, next_month]
    });

    httpRequest(`${battle_url}/get_now_battle`, 'POST', params)
      .then(res => {
        resolve({
          version: version,
          battle: res
        });
      })
      .catch(err => {
        reject(err);
      })
  })
}

// 初始化公会信息
const initGuild = ctx => {
  const { update } = require('../_terminal/index');
  const { raw_message } = ctx;

  getBattle(ctx)
    .then(data => {
      const { reply } = ctx;
      const { version, battle } = data;

      let new_version = null;
      switch (raw_message.slice(2, 4)) {
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

      if (version === new_version) return reply(`当前群聊已设置 ${raw_message.slice(2, 4)} 公会，请不要重复修改`);
      // 未做会战是否结束的时间判断，待优化
      // if (battle.id) return reply('当月已开启会战，请不要在中途修改游戏服务器');

      ctx.raw_message = `> update battle version ${new_version}`;
      update(ctx);
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 开启会战
const insertBattle = async ctx => {
  await checkBattle(ctx);

  const { level, reply } = ctx;

  if (level < 3) return reply(`你当前为 Level ${level}，开启会战需要达到 Level 3 ，权限不足`);

  const { version, battle } = await getBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (battle.id) return reply('当月已开启会战，请勿重提提交');

  const { time } = getDate();
  const { raw_message, group_id } = ctx;
  // 当期星座
  const title = raw_message.slice(2, 5);
  // 获取 boss 血量
  const [one, two, three, four, five] = await getMaxBlood(version, 1);
  // 会战预约信息
  const crusade = '{\n  "one":[],\n  "two":[],\n  "three":[],\n  "four":[],\n  "five":[]\n}';
  const params = querystring.stringify({
    params: [group_id, title, one, two, three, four, five, crusade]
  });

  // 写入会战数据
  httpRequest(`${battle_url}/set_battle`, 'POST', params)
    .then(() => {
      // 发送会战数据
      let msg = `******  ${version === 'tw' ? '台' : (version === 'jp' ? '日' : '国')}服 ${title} 会战  ******\n`;

      for (let i = 1; i <= 5; i++) {
        const max_blood = eval(`${en_char[i]}`)

        msg += `\n\t${cn_char[i]}王：${max_blood} / ${max_blood}\n\t讨伐：暂无\n`;
      }

      msg += `\n*******************************\n会战信息：1 周目 1 阶段\n当前出刀：0 / 90\n更新时间：${time}`;

      reply(msg)
      bot.logger.info(`INSERT battle succrss: ${group_id}`);
    })
    .catch(err => {
      reply(err)
      bot.logger.error(err);
    })
}

// 中止会战
const deleteBattle = async ctx => {
  await checkBattle(ctx);

  const { group_id, level, reply } = ctx;

  if (level < 3) return reply(`你当前为 Level ${level}，中止会战需要达到 Level 3 ，权限不足`);

  const { version, battle } = await getBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.id) return reply('当月未发起会战，请先初始化数据');

  const { the_month, next_month } = getDate();
  const post_data = querystring.stringify({
    params: [group_id, the_month, next_month]
  });

  httpRequest(`${battle_url}/delete_battle`, 'POST', post_data)
    .then(() => {
      reply('当月会战已中止，所有数据清空完毕');
    })
    .catch(err => {
      reply(err);
      bot.logger.error(err);
    })
}

// 当前状态
const selectBattle = async ctx => {
  const { reply } = ctx;
  const { version, battle } = await getBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.id) return reply('当月未发起会战，请先初始化数据');

  const { title, syuume, one, two, three, four, five, crusade, length, update_time } = battle;
  // 获取 boss 血量
  const max_blood = await getMaxBlood(version, syuume);
  // 格式化 crusade
  const crusade_json = JSON.parse(crusade);

  let msg = `******  ${version === 'tw' ? '台' : (version === 'jp' ? '日' : '国')}服 ${title} 会战  ******\n`;

  for (let i = 1; i <= 5; i++) {
    const blood = eval(`${en_char[i]}`)
    const crusade_member = crusade_json[en_char[i]];
    const title = blood ? [`${cn_char[i]}王`, `讨伐`] : [`扑街`, `预约`];

    // 如果有人网名里带 @ 会导致字段丢失，待优化（谁他喵的用 @ 当网名啊喂
    msg += `\n\t${title[0]}：${blood} / ${max_blood[i - 1]}\n\t${title[1]}：${crusade_member.length ? crusade_member.map(item => item.split('@')[0]).join(', ') : `暂无`}\n`;
  }

  msg += `\n*******************************\n会战信息：${syuume} 周目 ${syuume <= 3 ? 1 : (syuume <= 10 ? 2 : syuume <= 34 ? 3 : 4)} 阶段\n当前出刀：${length} / 90\n更新时间：${update_time}`;
  reply(msg);
}

// 查刀
const selectBeat = async ctx => {
  const { reply } = ctx;
  const { version, battle } = await getBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.id) return reply('当月未发起会战，请先初始化数据');

  const { today, tomorrow } = getDate();
  const { group_id, user_id, nickname, card } = ctx;
  const params = querystring.stringify({
    params: [group_id, user_id, today, tomorrow]
  });

  httpRequest(`${battle_url}/get_now_beat`, 'POST', params)
    .then(res => {
      const { length } = res;
      let msg = `**********  出刀信息  **********\n`;

      for (let i = 0; i < length; i++) {
        msg += `\n\t${res[i].fight_time}：\n\t\t(${res[i].number}) ${card ? card : nickname} 对 ${cn_char[res[i].boss]}王 造成了 ${res[i].damage} 点伤害\n`;
      }
      msg += `${length < 1 ? `\n\t暂无数据\n` : ``}`;
      msg += `\n*******************************`;
      msg += `\n成员 ${card ? card : nickname} ${length ? (`${res[0].number < 3 ? `还有 ${3 - res[0].number} 刀未出` : `已出完三刀`}`) : `今日未出刀`}`;
      reply(msg);
    })
    .catch(err => {
      reply(err.message);
      bot.logger.error(err);
    })
}

// 代报
const replace = async ctx => {
  await checkBattle(ctx);

  const { reply } = ctx;
  const { version, battle } = await getBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.id) return reply('当月未发起会战，请先初始化数据');

  const { user_id, raw_message } = ctx;
  const [replace_id, replace_name, replace_message] = raw_message.match(/(?<=qq=)\d+|(?<=text=@).+(?=\])|(?<=\]).*/g);

  if (replace_id === user_id) {
    reply(`[CQ:at,qq=${user_id}] 不能自己跟自己代报 (╯▔皿▔)╯`);
    return;
  }

  const boss = Number(replace_message.match(/\d(?=\s?\u4EE3\u62A5)/g));
  const damage = Number(replace_message.match(/(?<=\u4EE3\u62A5\s?)\d+/g));
  // const damage_info = replace_message.match(/\d(?=\s?\u4EE3\u62A5)|(?<=\u4EE3\u62A5\s?)\d+/g);
  ctx.card = replace_name;
  ctx.user_id = replace_id;
  ctx.raw_message = `${boss ? boss : ``} ${damage ? `报刀 ${damage}` : `尾刀`}`;

  insertBeat(ctx);
}

// 报刀
const insertBeat = async ctx => {
  await checkBattle(ctx);

  const { reply } = ctx;
  const { version, battle } = await getBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.id) return reply('当月未发起会战，请先初始化数据');

  // 当天是否已出刀
  // SELECT * FROM beat WHERE group_id = ? AND user_id = ? AND fight_time REGEXP '${year}-${month}-(${day}\s[0-2]\d|${day+1}\s0[0-4])' ORDER BY fight_time DESC
  const { group_id, user_id } = ctx;
  const { today, tomorrow } = getDate();
  const params = querystring.stringify({
    params: [group_id, user_id, today, tomorrow]
  });

  httpRequest(`${battle_url}/get_now_beat`, 'POST', params)
    .then(res => {
      const { nickname, card, raw_message } = ctx;
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
        params: [id, group_id, user_id, damage ? parseInt(number_sum) + 1 : number_sum + 0.5, syuume, boss, damage ? damage : all_blood[boss - 1], note]
      });

      // 插入 beat 数据
      httpRequest(`${battle_url}/set_beat`, 'POST', params)
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

          // 清空讨伐数据
          const crusade_json = JSON.parse(crusade);
          const crusade_set = new Set(crusade_json[en_char[boss]]);
          const crusade_member = `${card ? card : nickname}@${user_id}`;
          crusade_set.has(crusade_member) && crusade_set.delete(crusade_member)
          crusade_json[en_char[boss]] = damage ? [...crusade_set] : [];

          reply(`${note}${next < 5 ? '' : `\n所有 boss 已被斩杀，开始进入 ${syuume + 1} 周目`}`);

          // 更新 battle
          updateBattle(
            ctx,
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

// 修改出刀
const updateBeat = async ctx => {
  await checkBattle(ctx);

  const { reply } = ctx;
  const { version, battle } = await getBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.id) return reply('当月未发起会战，请先初始化数据');

  const { today, tomorrow } = getDate();
  const { group_id, user_id, raw_message } = ctx;
  // 当天是否已出刀
  const params = querystring.stringify({
    params: [group_id, user_id, today, tomorrow]
  });
  httpRequest(`${battle_url}/get_now_beat`, 'POST', params)
    .then(res => {
      const [number, damage] = raw_message.match(/\d(\.5)?(?=\s?修改)|(?<=修改\s?)\d+/g).map(Number);
      const beat_info = res.find(item => item.number === number)
      const { nickname, card } = ctx;

      if (!beat_info) return reply(`${card ? card : nickname} 没有第 ${number} 刀的出刀信息`);

      const params = querystring.stringify({
        params: [damage, user_id, number, today, tomorrow]
      });

      httpRequest(`${battle_url}/update_beat`, 'POST', params)
        .then(() => {
          reply(`修改成功`);

          // 修改 battle 信息
          const { boss } = beat_info;
          const { syuume, one, two, three, four, five, crusade } = battle;
          const all_blood = [one, two, three, four, five];

          // 修改血量
          all_blood[boss - 1] = all_blood[boss - 1] + (beat_info.damage - damage);

          updateBattle(
            ctx,
            syuume,
            all_blood,
            crusade
          );
        })
        .catch(err => {
          reply(err);
          bot.logger.error(err);
        })
    })
    .catch(err => {
      reply(err);
      bot.logger.error(err);
    })
}

// 更新 battle
const updateBattle = (ctx, syuume, all_blood, crusade) => {
  const { group_id } = ctx;
  const { time, the_month, next_month } = getDate();
  const [one, two, three, four, five] = all_blood;

  const params = querystring.stringify({
    params: [syuume, one, two, three, four, five, crusade, time, group_id, the_month, next_month]
  });

  httpRequest(`${battle_url}/update_battle`, 'POST', params)
    .then(() => {
      selectBattle(ctx);
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 预约
const reservation = async ctx => {
  const { reply } = ctx;
  const { version, battle } = await getBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.id) return reply('当月未发起会战，请先初始化数据');

  const { crusade } = battle;
  const { group_id, raw_message, user_id, nickname, card } = ctx;

  const crusade_json = JSON.parse(crusade);
  const crusade_member = `${card ? card : nickname}@${user_id}`;
  const boss = raw_message.slice(2).trim();

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
      params: [JSON.stringify(crusade_json, null, 2), time, group_id, the_month, next_month]
    });

    httpRequest(`${battle_url}/reservation`, 'POST', params)
      .then(() => {
        reply(`${card ? card : nickname} 预约 ${cn_char[boss]}王 成功`);
      })
      .catch(err => {
        reply(err.message);
        bot.logger.error(err);
      })
  }

  // 不传入 boss 实参则发送预约信息
  let msg = '**********  预约信息  **********\n';
  for (let i = 1; i <= 5; i++) {
    msg += `\n\t${cn_char[i]}王：${crusade_json[en_char[i]].length ? crusade_json[en_char[i]].map(item => item.split('@')[0]).join(', ') : '暂无'}\n`;
  }

  msg += `\n*******************************`;
  reply(msg);
}

// 创建账号信息
const insertUser = ctx => {
  return new Promise((resolve, reject) => {
    const { user_id } = ctx;
    const params = querystring.stringify({
      params: [user_id]
    });

    // 查询账号是否存在
    httpRequest(`${battle_url}/get_user`, 'POST', params)
      .then(res => {
        if (res.length) return resolve();

        const { nickname } = ctx;
        const params = querystring.stringify({
          params: [user_id, nickname]
        });

        // 账号不存在则写入数据
        httpRequest(`${battle_url}/set_user`, 'POST', params)
          .then(() => {
            bot.logger.info(`INSERT user succrss: ${user_id}`);
            resolve();
          })
          .catch(err => {
            reject(err);
          })
      })
      .catch(err => {
        reject(err);
      })
  })

  // let password = '';

  // // 生成随机密码，小写字母 'a' 的 ASCII 是 97 , a-z 的 ASCII 码就是 97 + 0 ~ 25;
  // for (let i = 0; i <= 5; i++) password += (String.fromCharCode(97 + Math.floor(Math.random() * 26)));
}

// 录入群聊信息
const insertGroups = ctx => {
  return new Promise((resolve, reject) => {
    const { group_id } = ctx;

    const params = querystring.stringify({
      params: [group_id]
    });

    // 查询公会是否存在
    httpRequest(`${battle_url}/get_groups`, 'POST', params)
      .then(res => {
        if (res.length) return resolve();

        const { group_name } = ctx;
        const params = querystring.stringify({
          params: [group_id, group_name]
        });

        // 账号不存在则写入数据
        httpRequest(`${battle_url}/set_groups`, 'POST', params)
          .then(() => {
            resolve();
            bot.logger.info(`INSERT group succrss: ${group_id}`);
          })
          .catch(err => {
            reject(err);
          })
      })
      .catch(err => {
        reject(err);
      })
  })
}

// 录入成员信息
const insertMember = ctx => {
  return new Promise((resolve, reject) => {
    const { group_id, user_id } = ctx;
    const params = querystring.stringify({
      params: [group_id, user_id]
    });

    // 查询成员是否存在
    httpRequest(`${battle_url}/get_member`, 'POST', params)
      .then(res => {
        if (res.length) return resolve();

        const { card } = ctx;
        const params = querystring.stringify({
          params: [group_id, user_id, card]
        });

        // 账号不存在则写入数据
        httpRequest(`${battle_url}/set_member`, 'POST', params)
          .then(() => {
            bot.logger.info(`INSERT member succrss: ${group_id} ${user_id}`);
            resolve();
          })
          .catch(err => {
            reject(err);
          })
      })
      .catch(err => {
        reject(err);
      })
  })
}

const checkBattle = async ctx => {
  // 待优化 这里应该单独写一个事务处理校验
  await insertUser(ctx)
  await insertGroups(ctx)
  await insertMember(ctx)
}

module.exports = {
  initGuild,
  insertBattle,
  deleteBattle,
  selectBattle,
  insertBeat,
  replace,
  reservation,
  updateBeat,
  selectBeat
};