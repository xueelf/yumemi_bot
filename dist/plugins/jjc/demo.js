"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const yumemi_1 = require("../../utils/yumemi");
// 光 佬 我 要 key 
function pcrdfans(data) {
}
function jjc(bot, data) {
    const { jjc } = yumemi.cmd;
    const { groups } = bot;
    const { group_id, raw_message } = data;
    if (!groups[group_id].plugins.includes('jjc')) {
        return;
    }
    yumemi_1.checkCommand(raw_message, jjc.pcrdfans) && pcrdfans(data);
}
function activate(bot) {
    bot.on("message.group", (data) => jjc(bot, data));
}
exports.activate = activate;
function deactivate(bot) {
    bot.off("message.group", jjc);
}
exports.deactivate = deactivate;
