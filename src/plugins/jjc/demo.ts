import { Client, GroupMessageEventData } from "oicq";
import { checkCommand } from "../../utils/yumemi";

// 光 佬 我 要 key 
function pcrdfans(data: GroupMessageEventData) {

}

function jjc(bot: Client, data: GroupMessageEventData) {
  const { jjc } = yumemi.cmd;
  const { groups } = bot;
  const { group_id, raw_message } = data;

  if (!groups[group_id].plugins.includes('jjc')) {
    return
  }
  checkCommand(raw_message, jjc.pcrdfans) && pcrdfans(data);
}

function activate(bot: Client): void {
  bot.on("message.group", (data: GroupMessageEventData) => jjc(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("message.group", jjc);
}

export {
  activate, deactivate
}