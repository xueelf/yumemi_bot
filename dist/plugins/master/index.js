"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const yumemi_1 = require("../../utils/yumemi");
// 申请头衔
async function title(bot, data) {
    const { uin, gl, setGroupSpecialTitle } = bot;
    const { group_id, user_id, raw_message, reply } = data;
    const level = await yumemi_1.getLevel(bot, data);
    let msg = null;
    switch (true) {
        case gl.get(group_id)?.owner_id !== uin:
            msg = `该服务需要 bot 拥有群主权限才能正常使用`;
            break;
        case level < 2:
            msg = `你当前为 Level ${level}，申请头衔需要达到 Level 2`;
            break;
    }
    if (msg) {
        reply(msg);
        return;
    }
    const title = raw_message.substr(4).trim();
    setGroupSpecialTitle(group_id, user_id, title);
}
function master(bot, data) {
    const { master } = yumemi.cmd;
    const { groups } = bot;
    const { group_id, raw_message } = data;
    if (!groups[group_id].plugins.includes('master')) {
        return;
    }
    yumemi_1.checkCommand(raw_message, master.title) && title(bot, data);
}
function activate(bot) {
    bot.on("message.group", (data) => master(bot, data));
}
exports.activate = activate;
function deactivate(bot) {
    bot.off("message.group", master);
}
exports.deactivate = deactivate;
