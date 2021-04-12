class GVG {
  static addZero = number => number < 10 ? '0' + number : number;

  constructor(group_id, group_name, user_id, raw_message, nickname, level, version, battle, date) {
    this.group_id = group_id;
    this.group_name = group_name;
    this.user_id = user_id;
    this.raw_message = raw_message;
    this.nickname = nickname;
    this.level = level;
    this.version = version;
    this.battle = battle;
    this.date = date;
  }

  // 初始化公会信息
  initGuild() {
    const terminal = require('../__terminal/index');
    const guild = this.raw_message.slice(2, 4);
    const raw_message = `> update gvg version ${guild === '国服' ? 'bl' : (guild === '台服' ? 'tw' : 'jp')}`;
    const ctx = {
      group_id: this.group_id,
      user_id: this.user_id,
      raw_message,
      level: this.level,
      serve: `update`,
    }

    terminal(ctx, 'update');
  }

  // 获取当前 boss 的 max 血量
  getBlood(syuume, boss) {
    let stage = null;
    const blood = tools.getYAML('boss');

    if (syuume <= 3)
      stage = 1;
    else if (syuume <= 10)
      stage = 2;
    else if (syuume <= 35)
      stage = 3;
    else
      // 国服没有 4 阶段
      stage = this.version !== 'bl' ? 4 : 3;

    return blood[this.version][stage - 1][boss - 1];
  }

  // 预约
  reservation() {
    const boss = this.raw_message.slice(2).trim();
    const reservation = this.getReservation();

    // boss 传入实参则插入预约信息
    if (boss) {
      for (let i = 0; i < reservation[this.group_id][boss].length; i++) {
        if (this.user_id == reservation[this.group_id][boss][i].split('@')[0]) {
          bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 你已预约 ${boss} 王，请勿重复预约`)
          return;
        }
      }

      reservation[this.group_id][boss].push(`${this.user_id}@${this.nickname}`);
      tools.setYAML('reservation', reservation, __dirname);
      bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 预约 ${boss} 王成功`);
    }

    // 不传入 boss 实参则发送预约信息
    let msg = '当前预约信息:';
    let member = '';
    for (let i = 1; i <= 5; i++) {
      for (let j = 0; j < reservation[this.group_id][i].length; j++) {
        if (reservation[this.group_id][i][j]) {
          member += ` ${reservation[this.group_id][i][j].split('@')[1]},`
        }
      }

      msg += `\n  ${i}王: ${member}`;
      member = '';
    }

    bot.sendGroupMsg(this.group_id, msg);
  }

  // 获取 reservation.yml
  getReservation() {
    const reservation = tools.getYAML('reservation', __dirname) || {};

    if (!reservation[this.group_id]) {
      reservation[this.group_id] = {};
      for (let i = 1; i <= 5; i++) reservation[this.group_id][i] = [];

      tools.setYAML('reservation', reservation, __dirname);
    }

    return reservation;
  }

  // 查询状态
  selectBattle() {
    const member = [];
    const reservation = this.getReservation();
    const { title, syuume, boss, blood, start_time } = this.battle;

    for (let i = 0; i < reservation[this.group_id][boss].length; i++) {
      member.push(`${reservation[this.group_id][boss][i].split('@')[1]}`)
    }
    const maxBlood = this.getBlood(syuume, boss);
    bot.sendGroupMsg(this.group_id, `${title} 会战:\n\t${syuume} 周目 ${boss} 王  ${blood} \\ ${maxBlood}\n当前讨伐成员: \n\t${member.length ? member : '暂无'}\n数据更新时间:\n\t${start_time}`);
  }

  // 开启会战
  async insertBattle() {
    const title = this.raw_message.slice(2, 5);
    const blood = this.getBlood(1, 1);
    const sql = "INSERT INTO battle (group_id, title, blood, start_time) VALUES ($group_id, $title, $blood, $time)";
    const param = {
      $group_id: this.group_id,
      $title: title,
      $blood: blood,
      $time: this.date.time,
    };

    await new tools.SQL(sql, param).run()
      .then(() => {
        this.battle = { title, syuume: 1, boss: 1, blood, start_time: this.date.time };
        this.selectBattle();
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, `${err} gvg.js:123`)
        bot.logger.error(`${err} gvg.js:124`);
      })
  }

  // 中止会战
  async deleteBattle() {
    const sql = `DELETE FROM battle WHERE group_id = $group_id AND start_time like $month`;
    const param = {
      $group_id: this.group_id,
      $month: `${this.date.tomonth}%`,
    };

    await new tools.SQL(sql, param).run()
      .then(() => {
        bot.sendGroupMsg(this.group_id, '当月会战已中止，所有数据清空完毕');
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, `${err}`)
        bot.logger.error(`${err}`);
      })
  }

  // 修改
  async updateBattle() {
    // 拆分 raw_message 字段
    const new_data = { syuume: '周目', boss: 'boss', blood: '血量' }

    for (const item in new_data) {
      const index = this.raw_message.indexOf(new_data[item]);
      new_data[item] = index === -1 ? null : parseInt(this.raw_message.slice(index + new_data[item].length));
    }

    const title = this.battle.title;
    const syuume = !new_data.syuume ? this.battle.syuume : new_data.syuume;
    const boss = !new_data.boss ? this.battle.boss : new_data.boss;
    const blood = !new_data.blood ? this.battle.blood : new_data.blood;
    const sql = "UPDATE battle SET title = $title, syuume = $syuume, boss = $boss, blood = $blood, start_time = $time WHERE group_id = $group_id AND start_time like $month";
    const param = {
      $title: title,
      $syuume: syuume,
      $boss: boss,
      $blood: blood,
      $group_id: this.group_id,
      $time: this.date.time,
      $month: `${this.date.tomonth}%`,
    };

    await new tools.SQL(sql, param).run()
      .then(() => {
        this.battle = { title, syuume, boss, blood, start_time: this.date.time };
        this.selectBattle();
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, `${err}`);
        bot.logger.error(`${err}`);
      })
  }

  // 报刀
  async insertFight() {
    // 当天是否已出刀
    // SELECT * FROM fight_view WHERE fight_time REGEXP '${year}/${month}/(${day}\s[0-2]\d|${day+1}\s0[0-4])' ORDER BY fight_time DESC
    const sql = "SELECT * FROM fight_view WHERE group_id = $group_id AND user_id = $user_id AND fight_time BETWEEN $today AND $tomorrow ORDER BY number DESC, fight_time DESC";
    const param = {
      $group_id: this.group_id,
      $user_id: this.user_id,
      $today: this.date.today,
      $tomorrow: this.date.tomorrow,
    };

    await new tools.SQL(sql, param).get()
      .then(async row => {
        row = row ? row : { number: 0 };

        if (row.number === 3) {
          bot.sendGroupMsg(this.group_id, `${this.nickname} 今天已经出完3刀了，请不要重复提交数据`);
          return;
        }
        // 拆分 raw_message 字段
        const damage = parseInt(this.raw_message.slice(2));

        if (damage >= this.battle.blood) {
          bot.sendGroupMsg(this.group_id, `伤害值超出 boss 剩余血量，若以斩杀 boss 请使用「尾刀」指令`);
          return;
        }
        if (damage === 0) {
          bot.sendGroupMsg(this.group_id, `伤害0？这么说，你很勇咯？\n[CQ:image,file=${__yumemi}/data/images/emoji/fight.jpg]`);
          return;
        }
        console.log(row)
        const note = `${this.nickname}  对 ${this.battle.boss} 王造成了 ${!isNaN(damage) ? `${damage} 点伤害` : `${this.battle.blood} 点伤害并击破`}`;
        const number = !isNaN(damage) && Number.isInteger(row.number) ? row.number + 1 : row.number + 0.5;
        const syuume = isNaN(damage) && this.battle.boss > 4 ? this.battle.syuume + 1 : this.battle.syuume;
        const boss = !isNaN(damage) ? this.battle.boss : (this.battle.boss < 5 ? this.battle.boss + 1 : 1);
        const blood = !isNaN(damage) ? this.battle.blood - damage : this.getBlood(syuume, boss);
        const sql = "INSERT INTO fight (battle_id, group_id, user_id, number, syuume, boss, damage, note, fight_time) VALUES ($battle_id, $group_id, $user_id, $number, $syuume, $boss, $damage, $note, $time)";
        const param = {
          $battle_id: this.battle.battle_id,
          $group_id: this.group_id,
          $user_id: this.user_id,
          $number: number,
          $syuume: syuume,
          $boss: this.battle.boss,
          $damage: !isNaN(damage) ? damage : this.battle.blood,
          $note: note,
          $time: this.date.time,
        };

        await new tools.SQL(sql, param).run()
          .then(() => {
            bot.sendGroupMsg(this.group_id, note);
            this.raw_message = `周目 ${syuume} boss ${boss} 血量 ${blood}`;

            this.updateBattle().then(() => {
              if (isNaN(damage)) {
                // At 预约 boss
                let at = '';
                const reservation = this.getReservation();

                for (const user_id of reservation[this.group_id][boss]) {
                  at += `[CQ:at,qq=${parseInt(user_id)}] `;
                }
                if (at !== '') {
                  bot.sendGroupMsg(this.group_id, `${at} 到 ${boss}王 啦~'`);
                }

                // boss 被斩杀后清空预约数据
                reservation[this.group_id][boss === 1 ? 5 : boss - 1].length = 0;
                tools.setYAML('reservation', reservation, __dirname);
              }
            })
          })
          .catch(err => {
            bot.sendGroupMsg(this.group_id, err);
            bot.logger.error(`${err} gvg.js 271`);
          })
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, err);
        bot.logger.error(`${err} gvg.js 276`);
      })
  }

  // 查刀
  async selectFight() {
    const sql = "SELECT number, boss, damage FROM fight_view WHERE group_id = $group_id AND user_id = $user_id";
    const param = {
      $group_id: this.group_id,
      $user_id: this.user_id,
    };

    await new tools.SQL(sql, param).all()
      .then(rows => {
        let msg = `${this.nickname} 当天出刀：`;
        for (let i = 0; i < rows.length; i++) {
          msg += `\n  第 ${rows[i].number} 刀: [" Boss: ${rows[i].boss} 王, 伤害: ${rows[i].damage} "]`;
        }
        bot.sendGroupMsg(this.group_id, msg);
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, `${err}`);
        bot.logger.error(`${err}`);
      })
  }

  // 查树
  async selectSaveLoad() {
    const sql = "SELECT * FROM saveload_view WHERE group_id = $group_id AND sl_time BETWEEN $today AND $tomorrow";
    const param = {
      $group_id: this.group_id,
      $today: this.date.today,
      $tomorrow: this.date.tomorrow,
    };

    await new tools.SQL(sql, param).all()
      .then(rows => {
        const all = [];
        // const get = [];
        for (let i = 0; i < rows.length; i++) {
          const sl_data = `  ${rows[i].sl_time} ${rows[i].nickname}`;
          all.push(sl_data);
          // if (rows[i].syuume === this.battle.syuume && rows[i].boss === this.battle.boss) get.push(sl_data)
        }

        // bot.sendGroupMsg(this.group_id, `saveload：\n${all.length ? all.join('\n') : '  暂无数据'}\n当前挂树：\n${get.length ? get.join('\n') : '  暂无数据'}`);
        bot.sendGroupMsg(this.group_id, `saveload：\n${all.length ? all.join('\n') : '  暂无数据'}`);
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, `${err}`);
        bot.logger.error(`${err}`);
      })
  }

  // 会长救我
  async saveload() {
    // 查询是否 sl
    const sql = `SELECT * FROM saveload_view WHERE group_id = $group_id AND user_id = $user_id AND sl_time BETWEEN $today AND $tomorrow`;
    const param = {
      $group_id: this.group_id,
      $user_id: this.user_id,
      $today: this.date.today,
      $tomorrow: this.date.tomorrow,
    };

    await new tools.SQL(sql, param).get()
      .then(async row => {
        if (row) {
          bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 一天交两次 sl，你是想让会长进 icu 么（`);
          return;
        }

        const sql = "INSERT INTO saveload (group_id, user_id, syuume, boss, sl_time) VALUES ($group_id, $user_id, $syuume, $boss, $time)";
        const param = {
          $group_id: this.group_id,
          $user_id: this.user_id,
          $syuume: this.battle.syuume,
          $boss: this.battle.boss,
          $time: this.date.time,
        };

        await new tools.SQL(sql, param).run()
          .then(() => {
            bot.sendGroupMsg(this.group_id, `${this.nickname} saveload：\n\t${this.date.time}`);
            bot.logger.info(`INSERT member success: ${this.user_id}`)
          })
          .catch(err => {
            bot.sendGroupMsg(this.group_id, `${err}`)
            bot.logger.error(`${err}`);
          })
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, `${err}`);
        bot.logger.error(`${err}`);
      })
  }

  // 创建公会
  async insertGuild() {
    // 查询成员是否已存在
    const sql = `SELECT * FROM guild WHERE group_id = $group_id`;
    const param = {
      $group_id: this.group_id,
    };

    await new tools.SQL(sql, param).get()
      .then(async row => {
        // 成员不存在则写入数据
        if (row) return
        const sql = "INSERT INTO guild (group_id, name, create_time) VALUES ($group_id, $name, $today)";
        const param = {
          $group_id: this.group_id,
          $name: this.group_name,
          $today: this.date.time,
        };

        await new tools.SQL(sql, param).run()
          .then(() => {
            bot.logger.info(`INSERT guild success: ${this.user_id}`)
          })
          .catch(err => {
            bot.sendGroupMsg(this.group_id, `${err}`);
            bot.logger.error(`${err}`);
          })
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, `${err}`)
        bot.logger.error(`${err}`);
      })
  }

  // 加入成员
  async insertMember() {
    // 查询成员是否已存在
    const sql = `SELECT * FROM member WHERE group_id = $group_id AND user_id = $user_id`;
    const param = {
      $group_id: this.group_id,
      $user_id: this.user_id,
    };

    await new tools.SQL(sql, param).get()
      .then(async row => {
        // 成员不存在则写入数据
        if (row) return
        const sql = "INSERT INTO member (group_id, user_id) VALUES ($group_id, $user_id)";
        const param = {
          $group_id: this.group_id,
          $user_id: this.user_id,
        };
        await new tools.SQL(sql, param).run()
          .then(() => {
            bot.logger.info(`INSERT member success: ${this.user_id}`)
          })
          .catch(err => {
            bot.sendGroupMsg(this.group_id, `${err}`);
            bot.logger.error(`${err}`);
          })
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, `${err}`)
        bot.logger.error(`${err}`);
      })
  }

  // 注册账号
  async insertUser() {
    // 查询账号是否存在
    const sql = "SELECT user_id FROM user WHERE user_id = $user_id";
    const param = {
      $user_id: this.user_id,
    };

    await new tools.SQL(sql, param).get()
      .then(async row => {
        // 账号不存在则写入数据
        if (row) return
        // 生成密码
        let password = '';

        // 生成随机密码，小写字母 'a' 的 ASCII 是 97 , a-z 的 ASCII 码就是 97 + 0 ~ 25;
        for (let i = 0; i <= 5; i++) password += (String.fromCharCode(97 + Math.floor(Math.random() * 26)));

        const sql = "INSERT INTO user (user_id, nickname, password, record_time) VALUES ($user_id, $nickname, $password, $record_time)";
        const param = {
          $user_id: this.user_id,
          $nickname: this.nickname,
          $password: password,
          $record_time: this.date.time
        };

        await new tools.SQL(sql, param).run()
          .then(() => {
            bot.logger.info(`INSERT user success: ${this.user_id}`)
            bot.sendPrivateMsg(this.user_id, `你的账号已自动创建，初始密码为：${password}\n可登录后台自行修改，若遗忘发送「初始化密码」重置`);
          })
          .catch(err => {
            bot.sendGroupMsg(this.group_id, `${err}`);
            bot.logger.error(`${err}`);
          })
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, `${err}`);
        bot.logger.error(`${err}`);
      })
  }

  // 删除出刀信息
  // 修改出刀信息
  async updateFight() {
    const [, number, damage] = this.raw_message.split(' ');
    const sql = `UPDATE fight SET damage = $damage WHERE user_id = $user_id AND number = $number AND fight_time BETWEEN $today AND $tomorrow`;
    const param = {
      $damage: damage,
      $user_id: this.user_id,
      $number: number,
      $today: this.date.today,
      $tomorrow: this.date.tomorrow,
    };

    await new tools.SQL(sql, param).run()
      .then(() => {
        this.selectFight();
      })
      .catch(err => {
        bot.sendGroupMsg(this.group_id, `${err}`)
        bot.logger.error(`${err}`);
      })
  }

  // 代报
  acting() {
    const acting_info = this.raw_message.match(/(?<=\[CQ:at,qq=|\u4EE3\u62A5\s*)\d+/g);

    if (acting_info[0] === this.user_id) {
      bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 不能自己跟自己代报`);
      return;
    }

    bot.getGroupMemberInfo(this.group_id, acting_info[0]).then(async data => {
      const { data: { nickname, card } } = data;

      this.user_id = acting_info[0];
      this.nickname = !card ? nickname : card;
      this.raw_message = acting_info.length > 1 ? `报刀 ${acting_info[1]}` : `尾刀`;

      await this.insertUser();
      await this.insertGuild();
      await this.insertMember();

      this.insertFight();
    });
  }
}

// const sql = `SELECT * FROM situation WHERE group_id = $group_id AND time like $month`;
// const param = {
//   $group_id: group_id,
//   $month: `${month}%`,
// };

// await new tools.SQL(sql, param).get()
//   .then(row => {

//   })
//   .catch(err => {
//     bot.sendGroupMsg(group_id, `${err}`)
//     bot.logger.error(`${err}`);
//   })

// 分数线
// const score = async () => {
//   const rawData = JSON.parse(await tools.getRequest('https://tools-wiki.biligame.com/pcr/getTableInfo?type=subsection'));
//   let msg = '';
//   for (const item of rawData) {
//     msg += `排名：${item.rank}\n公会：${item.clan_name}\n分数：${item.damage}\n---------------\n`;
//   }
//   msg ?
//     bot.sendGroupMsg(group_id, msg) :
//     bot.sendGroupMsg(group_id, '会战未开启，无法获取数据')
//     ;
// }
// // 排名
// const rank = async () => {
//   const [, name, leader] = messageData.raw_message.split(' ');
//   const rawData = JSON.parse(await tools.getRequest(`https://tools-wiki.biligame.com/pcr/getTableInfo?type=search&search=${name}&page=0`));

//   let msg = '';
//   if (leader) {
//     for (const item of rawData) {
//       if (item.leader_name === leader) {
//         msg += `排名：${item.rank}\n公会：${item.clan_name}\n会长：${item.leader_name}\n分数：${item.damage}`;
//         break;
//       }
//     }
//   } else {
//     for (const item of rawData) {
//       msg += `排名：${item.rank}\n公会：${item.clan_name}\n会长：${item.leader_name}\n分数：${item.damage}\n---------------\n你未指定会长，以上为所有同名公会数据，最多显示前 30 条数据`;
//     }
//   }

//   msg ?
//     bot.sendGroupMsg(group_id, msg) :
//     bot.sendGroupMsg(group_id, '会战已结束，无法获取数据')
//     ;
// }

module.exports = async ctx => {
  const { group_id, serve } = ctx;
  const { [group_id]: { plugins: { gvg: { version } } } } = tools.getYAML('group');

  // 是否设置游戏服务器
  if (serve !== 'initGuild' && version === 'none') {
    bot.sendGroupMsg(group_id, '检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数...');
    return;
  }

  const now_date = new Date();
  const year = now_date.getFullYear();
  const month = GVG.addZero(now_date.getMonth() + 1);
  const day = GVG.addZero(now_date.getDate());
  const hour = GVG.addZero(now_date.getHours());
  const minute = GVG.addZero(now_date.getMinutes());

  const time = `${year}/${month}/${day} ${hour}:${minute}`;
  const today = `${year}/${month}/${day} 05`;
  const tomorrow = `${year}/${month}/0${Number(day) + 1} 05`;
  const tomonth = `${year}/${month}`;
  const date = {
    year, month, day, hour, minute, time, today, tomorrow, tomonth,
  }

  // 当月是否开启会战
  const sql = `SELECT * FROM battle WHERE group_id = $group_id AND start_time like $date`;
  const param = {
    $group_id: group_id,
    $date: `${date.tomonth}%`,
  };

  await new tools.SQL(sql, param).get()
    .then(async row => {
      if (!row && serve !== 'insertBattle' && serve !== 'initGuild') {
        bot.sendGroupMsg(group_id, '当月未发起会战，请先初始化数据')
        return;
      }

      const { group_name, user_id, raw_message, nickname, level } = ctx;
      const gvg = new GVG(group_id, group_name, user_id, raw_message, nickname, level, version, row, date);

      await gvg.insertUser();
      await gvg.insertGuild();
      await gvg.insertMember();

      switch (serve) {
        case 'initGuild':
          if (row) {
            bot.sendGroupMsg(group_id, '当月已开启会战，请勿中途修改游戏服务器');
            return;
          }

          gvg.initGuild();
          break;

        case 'insertBattle':
          if (row) {
            bot.sendGroupMsg(group_id, '当月已开启会战，请勿重提提交');
            return;
          }

          gvg.insertBattle();
          break;

        case 'updateBattle':
          gvg.updateBattle();
          break;

        case 'insertFight':
          gvg.insertFight();
          break;

        case 'acting':
          gvg.acting();
          break;

        case 'selectBattle':
          gvg.selectBattle();
          break;

        case 'selectSaveLoad':
          gvg.selectSaveLoad();
          break;

        case 'saveload':
          gvg.saveload();
          break;

        case 'reservation':
          gvg.reservation();
          break;

        case 'updateFight':
          gvg.updateFight();
          break;

        case 'selectFight':
          gvg.selectFight();
          break;

        case 'deleteBattle':
          gvg.deleteBattle();
          break;
      }
    })
    .catch(err => {
      bot.sendGroupMsg(group_id, `${err}`)
      bot.logger.error(`${err}`);
    })
}