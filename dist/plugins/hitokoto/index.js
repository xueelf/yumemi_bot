"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const node_schedule_1 = require("node-schedule");
const yumemi_1 = require("../../utils/yumemi");
const network_1 = require("../../utils/network");
let send_job;
// 获取一言相关参数
const { hitokoto: { url, params } } = yumemi.api;
// 获取一言
function get() {
    return new Promise((resolve, reject) => {
        network_1.httpsRequest.get(url, params)
            .then((res) => {
            const msg = `${res.hitokoto}\n\t\t\t\t———— 「${res.from}」`;
            resolve(msg);
        })
            .catch(err => {
            reject(err);
        });
    });
}
// 发送一言
function send(data) {
    const { reply } = data;
    get()
        .then((data) => {
        reply(data);
    })
        .catch((err) => {
        reply(err);
    });
}
// 定时发送
function autoSend(bot) {
    send_job = node_schedule_1.scheduleJob('0 0 0 * * ?', async () => {
        const { gl, groups } = bot;
        // 判断开启服务的群
        gl.forEach(async (val) => {
            const { group_id } = val;
            const { hitokoto: { autoSend } } = groups[group_id].settings;
            if (!groups[group_id].plugins.includes('hitokoto')) {
                return false;
            }
            autoSend && bot.sendGroupMsg(group_id, await get());
        });
    });
}
function hitokoto(bot, data) {
    const { hitokoto } = yumemi.cmd;
    const { groups } = bot;
    const { group_id, raw_message } = data;
    if (!groups[group_id].plugins.includes('hitokoto')) {
        return;
    }
    yumemi_1.checkCommand(raw_message, hitokoto.send) && send(data);
}
function activate(bot) {
    autoSend(bot);
    bot.on("message.group", (data) => hitokoto(bot, data));
}
exports.activate = activate;
function deactivate(bot) {
    bot.off("message.group", hitokoto);
    send_job?.cancel();
}
exports.deactivate = deactivate;
