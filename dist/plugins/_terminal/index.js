"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.activate = void 0;
const fs_1 = require("fs");
const os_1 = require("os");
const setu_1 = require("../setu");
const util_1 = require("../../utils/util");
const yumemi_1 = require("../../utils/yumemi");
// 锁定插件
async function lock(bot, data) {
    const { raw_message } = data;
    const plugin = raw_message.slice(2).trim();
    data.raw_message = `>update ${plugin} lock ${/锁定/.test(raw_message.slice(0, 2)) ? true : false}`;
    update(bot, data);
}
// 插件控制
async function control(bot, data) {
    const { uin, groups } = bot;
    const { group_id, user_id, raw_message, reply } = data;
    const [action, plugin] = raw_message.split(' ');
    const isAll = plugin === 'all';
    const isEnable = action === '>enable';
    const plugins = groups[group_id].plugins;
    let msg = null;
    switch (true) {
        case isEnable && !isAll && !bot.plugins.has(plugin):
            msg = `不存在 ${plugin} 服务，请输入合法参数`;
            break;
        case isEnable && plugins.includes(plugin):
            msg = `已启用 ${plugin} 服务，不要重复启用`;
            break;
        case action === '>disable' && !isAll && !plugins.includes(plugin):
            msg = `没有启用 ${plugin} 服务，不要重复禁用`;
            break;
        case isAll:
            plugins.length = 0;
            break;
    }
    if (msg) {
        reply(msg);
        return;
    }
    const level = await yumemi_1.getLevel(bot, data);
    if (!isAll && level < 5 && groups[group_id].settings[plugin].lock) {
        reply(`${plugin} 已被锁定，解锁需要达到 level 5，你当前为 Level ${level} 无法修改参数`);
        return;
    }
    if (!isAll && level > 4 && groups[group_id].settings[plugin].lock) {
        reply(`${plugin} 已被锁定，需要先解锁才能修改相关参数`);
        return;
    }
    // bug: >disable all 不受 lock 影响
    if (level > 2) {
        isEnable ?
            (!isAll ?
                plugins.push(plugin) :
                bot.plugins.forEach((val, key) => /^(?!_).+/.test(key) && !groups[group_id].settings[key].lock && plugins.push(key))) :
            plugins.splice(plugins.findIndex(item => item === plugin), 1);
        util_1.setProfile(uin.toString(), groups, path.groups)
            .then(() => {
            if (!isAll) {
                reply(`plugin: {\n  "${plugin}": ${isEnable ? "deactivate  >>>  activate" : "activate  >>>  deactivate"}\n`);
            }
            else {
                reply(isEnable ? '所有插件加载完毕 ♪' : '所有插件已禁用');
            }
        })
            .catch((err) => {
            reply(err);
        });
    }
    else {
        bot.setGroupBan(group_id, user_id, 60 * 5);
        reply(`你当前为 level ${level} ，修改配置文件要达到 level 3 ，权限不足，请不要乱碰奇怪的开关`);
    }
}
// 更新配置文件
async function update(bot, data) {
    const level = await yumemi_1.getLevel(bot, data);
    const { uin, groups } = bot;
    const { group_id, user_id, raw_message, reply } = data;
    const [, plugin, setting, param] = raw_message.split(' ');
    console.log(raw_message);
    const plugins = fs_1.readdirSync(path.plugins);
    if (!plugins.includes(plugin)) {
        reply(`不存在 ${plugin} 服务模块`);
        return;
    }
    if (level > 2) {
        const settings = groups[group_id].settings[plugin];
        const old_settings = JSON.parse(JSON.stringify(settings));
        // 'false' 与 'true' 转换为 boolean false true
        settings[setting] = param === 'true' || param === 'false' ? param === 'true' : param;
        util_1.setProfile(uin.toString(), groups, path.groups)
            .then(() => {
            old_settings[setting] += `  >>>  ${param}`;
            reply(`${plugin}: ${JSON.stringify(old_settings, null, 2)}`);
        })
            .catch(err => {
            bot.logger.error(err);
            reply(`${err.message}`);
        });
    }
    else {
        bot.setGroupBan(group_id, user_id, 60 * 5);
        reply(`你当前为 level ${level} ，修改配置文件要达到 level 3 ，权限不足，请不要乱碰奇怪的开关`);
    }
}
exports.update = update;
// 打印运行信息
function state(data) {
    const { r17: { length: r17_length }, r18: { length: r18_length } } = setu_1.getSetuDir();
    const msg = `系统环境：${os_1.version()} ${os_1.release()}
运行时长：${(os_1.uptime() / 60 / 60).toFixed(1)} H
使用空间：${((os_1.totalmem() - os_1.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB / ${(os_1.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
色图库存：r17：${r17_length} / r18：${r18_length}
版本信息：${yumemi.info.version}`;
    data.reply(msg);
}
// 语法糖
function sugar(bot, data) {
    let { raw_message } = data;
    const param = /(关闭|禁用)/.test(raw_message.slice(0, 2)) ? false : true;
    ;
    const setting = raw_message.slice(2).trim();
    switch (setting) {
        case 'r18':
            data.raw_message = `>update setu r18 ${param}`;
            update(bot, data);
            break;
        case 'flash':
            data.raw_message = `>update setu flash ${param}`;
            update(bot, data);
            break;
        case 'bl':
        // case 'tw':
        case 'jp':
            data.raw_message = `>update bilibili ${setting} ${param}`;
            update(bot, data);
            break;
        case '群服务':
            data.raw_message = `>${param ? 'enable' : 'disable'} all`;
            control(bot, data);
            break;
        default:
            data.raw_message = `>${param ? 'enable' : 'disable'} ${setting}`;
            control(bot, data);
            break;
    }
}
// 退出当前群聊
async function quit(bot, data) {
    const { group_id, user_id, reply } = data;
    const level = await yumemi_1.getLevel(bot, data);
    level > 4 ?
        bot.setGroupLeave(group_id) :
        (reply(`你当前为 level ${level} ，退出群聊要达到 level 4 ，这是一个很危险的开关，你知道么`),
            bot.setGroupBan(group_id, user_id));
}
function list(bot, data) {
    const { plugins, groups } = bot;
    const { group_id, reply } = data;
    const msg = ['当前群服务列表：'];
    plugins.forEach((val, key) => {
        if (/^(_).+/.test(key))
            return false;
        msg.push(groups[group_id].plugins.includes(key) ? `|○| ${key} ` : `|△| ${key} `);
    });
    msg.push('如要查看更多设置可输入 setting');
    reply(msg.join('\n'));
}
function setting(bot, data) {
    const { groups } = bot;
    const { group_id, reply } = data;
    reply(JSON.stringify(groups[group_id].settings, null, 2));
}
function terminal(bot, data) {
    const { _terminal } = yumemi.cmd;
    const { raw_message } = data;
    yumemi_1.checkCommand(raw_message, _terminal.update) && update(bot, data);
    yumemi_1.checkCommand(raw_message, _terminal.state) && state(data);
    yumemi_1.checkCommand(raw_message, _terminal.sugar) && sugar(bot, data);
    yumemi_1.checkCommand(raw_message, _terminal.control) && control(bot, data);
    yumemi_1.checkCommand(raw_message, _terminal.list) && list(bot, data);
    yumemi_1.checkCommand(raw_message, _terminal.setting) && setting(bot, data);
    yumemi_1.checkCommand(raw_message, _terminal.lock) && lock(bot, data);
}
function activate(bot) {
    bot.on("message.group", (data) => terminal(bot, data));
}
exports.activate = activate;
