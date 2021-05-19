// 室外温度
const outdoor = null;
// 室内温度
const indoor = null;
// 湿度
const humidity = null;

// 环境温度的动态变化比我想象中要复杂的多...鸽了

const all_aircon = new Map();

class Aircon {
  constructor(m2, member) {
    this._enable = false;
    this._temperature = 20;
    // 房间面积（群内最大人数/平方米）
    this._m2 = m2;
    this._member = member;
  }

  get enable() {
    return this._enable;
  }

  set enable(val) {
    this._enable = val;
  }

  get temperature() {
    return this._temperature;
  }

  set temperature(val) {
    this._temperature = val;
  }

  get m2() {
    return this._m2;
  }

  set m2(val) {
    this._m2 = val;
  }

  get member() {
    return this._member;
  }

  set member(val) {
    this._member = val;
  }
}

const checkAircon = group_id => {
  return new Promise(async resolve => {
    const { data: { max_member_count, member_count } } = await bot.getGroupInfo(group_id);

    // 空调是否安装
    !all_aircon.has(group_id) && all_aircon.set(group_id, new Aircon(max_member_count, member_count))

    const aricon = all_aircon.get(group_id);
    // 更新空调信息
    aricon.m2 !== max_member_count ? aricon.m2 = max_member_count : void (0);
    aricon.member !== member_count ? aricon.member = member_count : void (0);

    resolve(aricon);
  })
}

const open = async ctx => {
  const { group_id, reply } = ctx;
  const aricon = await checkAircon(group_id)
  const { enable, temperature } = aricon;

  // 空调是否开启
  if (!enable) {
    aricon.enable = true;
    // reply(`[CQ:record,file=./data/records/di.amr]`);
    reply(`哔~\n${temperature < 26 ? '❄️' : '☀️'} 当前温度 ${temperature} ℃`);
  } else {
    reply(`空调开着呢！`);
  }
}

const close = async ctx => {
  const { group_id, reply } = ctx;
  const aricon = await checkAircon(group_id)
  const { enable, temperature } = aricon;

  // 空调是否开启
  if (enable) {
    aricon.enable = false;
    // reply(`[CQ:record,file=./data/records/di.amr]`);
    reply(`哔~\n💤 当前温度 ${temperature}℃`);
  } else {
    reply(`空调关着呢！`);
  }
}

const adjust = async ctx => {
  const { group_id, raw_message, reply } = ctx;
  const aricon = await checkAircon(group_id)

  if (!aricon.enable) return reply(`你空调没开！`);
  const temperature = Number(raw_message.match(/(?<=设置温度).*/g));

  switch (true) {
    case temperature === 114514:
      reply(`这空调怎么这么臭（恼）`);
      break;

    case temperature > 6000:
      reply(`温度最高不能超过 6000℃ 哦`);
      break;

    case temperature < -273:
      reply(`温度最少不能低于 -273℃ 哦`);
      break;

    default:
      aricon.temperature = temperature;

      let emoji = null;
      switch (true) {
        case temperature < 1:
          emoji = '🥶';
          break;
        case temperature < 26:
          emoji = '❄️';
          break;
        case temperature < 99:
          emoji = '☀️';
          break;
        case temperature <= 6000:
          emoji = '🥵';
          break;
      }

      // reply(`[CQ:record,file=./data/records/di.amr]`);
      reply(`哔~\n${emoji} 当前温度 ${temperature}℃`);
      break;
  }
}

const show = async ctx => {
  const { group_id, reply } = ctx;
  const aricon = await checkAircon(group_id);

  if (!aricon.enable) return reply(`你空调没开！`);

  const { temperature } = aricon;
  let emoji = null;

  switch (true) {
    case temperature < 1:
      emoji = '🥶';
      break;
    case temperature < 26:
      emoji = '❄️';
      break;
    case temperature < 99:
      emoji = '☀️';
      break;
    case temperature <= 6000:
      emoji = '🥵';
      break;
  }

  reply(`${emoji} 当前温度 ${temperature}℃`);
}

module.exports = { open, close, adjust, show }