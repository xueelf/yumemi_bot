import { Aircon, checkCommand } from "../../utils/yumemi";
import { Client, GroupInfo, GroupMessageEventData } from "oicq";

// 房间面积（群内最大人数/平方米）
// const m2: number = 300;
// 室外温度
// const outdoor: number = 30;
// 室内温度
// const indoor: number = 30;
// 湿度
// const humidity: number = 80;

// 环境温度的动态变化比我想象中要复杂的多...鸽了

const all_aircon: Map<number, Aircon> = new Map();

function checkAircon(bot: Client, group_id: number): Promise<Aircon> {
  return new Promise((resolve, reject) => {
    bot.getGroupInfo(group_id)
      .then((data) => {
        const group_info = data.data;
        const { max_member_count, member_count } = <GroupInfo>group_info;

        // 空调是否安装
        !all_aircon.has(group_id) && all_aircon.set(group_id, new Aircon(max_member_count, member_count))

        const aricon: Aircon = <Aircon>all_aircon.get(group_id);

        // 更新空调信息
        aricon.m2 !== max_member_count ? aricon.m2 = max_member_count : void (0);
        aricon.member !== member_count ? aricon.member = member_count : void (0);
        resolve(aricon);
      })
      .catch((err) => {
        reject(err);
      })
  })
}

async function open(bot: Client, data: GroupMessageEventData) {
  const { group_id, reply } = data;
  const aricon: Aircon = await checkAircon(bot, group_id)
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

async function close(bot: Client, data: GroupMessageEventData) {
  const { group_id, reply } = data;
  const aricon: Aircon = await checkAircon(bot, group_id)
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

async function adjust(bot: Client, data: GroupMessageEventData) {
  const { group_id, raw_message, reply } = data;
  const aricon: Aircon = await checkAircon(bot, group_id)

  if (!aricon.enable) {
    reply(`你空调没开！`);
    return;
  }
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
        case temperature < 40:
          emoji = '☀️';
          break;
        case temperature <= 100:
          emoji = '🥵';
          break;
        case temperature <= 6000:
          emoji = '💀';
          break;
      }

      // reply(`[CQ:record,file=./data/records/di.amr]`);
      reply(`哔~\n${emoji} 当前温度 ${temperature}℃`);
      break;
  }
}

async function show(bot: Client, data: GroupMessageEventData) {
  const { group_id, reply } = data;
  const aricon = await checkAircon(bot, group_id);

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
    case temperature < 40:
      emoji = '☀️';
      break;
    case temperature <= 100:
      emoji = '🥵';
      break;
    case temperature <= 6000:
      emoji = '💀';
      break;
  }

  reply(`${emoji} 当前温度 ${temperature}℃`);
}

function aircon(bot: Client, data: GroupMessageEventData): void {
  const { aircon } = yumemi.cmd;
  const { groups } = bot;
  const { group_id, raw_message } = data;

  if (!groups[group_id].plugins.includes('aircon')) {
    return
  }

  checkCommand(raw_message, aircon.open) && open(bot, data);
  checkCommand(raw_message, aircon.close) && close(bot, data);
  checkCommand(raw_message, aircon.adjust) && adjust(bot, data);
  checkCommand(raw_message, aircon.show) && show(bot, data);
}

function activate(bot: Client): void {
  bot.on("message.group", (data: GroupMessageEventData) => aircon(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("message.group", aircon);
}

export {
  activate, deactivate
}