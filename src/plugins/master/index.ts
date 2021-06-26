import { Client, GroupMessageEventData } from "oicq";
import { checkCommand, getLevel } from "../../utils/yumemi";

// 申请头衔
async function title(bot: Client, data: GroupMessageEventData): Promise<void> {
  const { uin, gl, setGroupSpecialTitle } = bot;
  const { group_id, user_id, raw_message, reply } = data;
  const level: number = await getLevel(bot, data)

  let msg: string | null = null;
  switch (true) {
    case gl.get(group_id)?.owner_id !== uin:
      msg = `该服务需要 bot 拥有群主权限才能正常使用`;
      break;
    case level < 2:
      msg = `你当前为 Level ${level}，申请头衔需要达到 Level 2`;
      break;
  }

  if (msg) {
    reply(msg)
    return;
  }

  const title: string = raw_message.substr(4).trim();

  setGroupSpecialTitle(group_id, user_id, title);
}

function master(bot: Client, data: GroupMessageEventData): void {
  const { master } = yumemi.cmd;
  const { groups } = bot;
  const { group_id, raw_message } = data;

  if (!groups[group_id].plugins.includes('master')) {
    return
  }

  checkCommand(raw_message, master.title) && title(bot, data);
}

function activate(bot: Client): void {
  bot.on("message.group", (data: GroupMessageEventData) => master(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("message.group", master);
}

export {
  activate, deactivate
}