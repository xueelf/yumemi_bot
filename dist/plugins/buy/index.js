"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const fs_1 = require("fs");
const node_schedule_1 = require("node-schedule");
const all_job = new Set();
const utc8 = '0 0 0/6 * * ?';
const utc9 = '0 0 1,7,13,19 * * ?';
const buy_path = './data/images/buy/';
const buy_images = fs_1.readdirSync('./data/images/buy');
function send(bot, all_group) {
    const img = buy_images[Math.floor(Math.random() * buy_images.length)];
    for (const group_id of all_group) {
        bot.sendGroupMsg(group_id, `[CQ:image,file=${buy_path}${img}]`);
    }
}
function scheduleBuy(bot, cron, version) {
    const { groups } = bot;
    return node_schedule_1.scheduleJob(cron, async () => {
        const all_group = [];
        for (const group_id in groups) {
            if (!groups[group_id].plugins.includes('buy')) {
                break;
            }
            groups[group_id].settings.buy.version === version && all_group.push(Number(group_id));
        }
        send(bot, all_group);
    });
}
function buy(bot) {
    all_job.add(scheduleBuy(bot, utc8, 'cn'));
    all_job.add(scheduleBuy(bot, utc9, 'jp'));
}
function activate(bot) {
    buy(bot);
}
exports.activate = activate;
function deactivate(bot) {
    all_job.forEach((val) => val.cancel());
    all_job.clear();
}
exports.deactivate = deactivate;
