"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLevel = exports.checkGroup = exports.checkCommand = exports.httpsRequest = exports.httpRequest = exports.deleteFolder = exports.deleteFile = exports.getProfileSync = exports.getProfile = exports.setProfile = void 0;
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const js_yaml_1 = require("js-yaml");
const fs_1 = require("fs");
const plugin_1 = require("./plugin");
/**
 * 更新配置文件
 * @param file_name 文件名（不包括后缀）
 * @param data 文件 yaml 对象
 * @param file_folder 文件夹路径
 * @returns Promise 对象
 */
function setProfile(file_name, data, file_folder = './config') {
    return new Promise((resolve, reject) => {
        const file_path = `${file_folder}/${file_name}.yml`;
        fs_1.writeFile(file_path, js_yaml_1.dump(data), err => {
            !err ? resolve() : reject(err);
        });
    });
}
exports.setProfile = setProfile;
/**
 * async 获取配置文件
 * @param file_name 文件名（不包括后缀）
 * @param file_folder 文件夹路径
 * @returns 返回 Promise 对象
 */
function getProfile(file_name, file_folder = './config') {
    return new Promise((resolve, reject) => {
        const file_path = `${file_folder}/${file_name}.yml`;
        fs_1.readFile(file_path, 'utf-8', (err, data) => {
            !err ? resolve(js_yaml_1.load(data) || {}) : reject(err);
        });
    });
}
exports.getProfile = getProfile;
/**
 * await 获取配置文件
 * @param file_name 文件名（不包括后缀）
 * @param file_folder 文件夹路径
 * @returns 返回 JSON 对象
 */
function getProfileSync(file_name, file_folder = './config') {
    const file_path = `${file_folder}/${file_name}.yml`;
    try {
        return js_yaml_1.load(fs_1.readFileSync(file_path, 'utf-8')) || {};
    }
    catch (err) {
        throw err;
    }
}
exports.getProfileSync = getProfileSync;
function checkCommand(plugin_name, data, bot) {
    let action = '';
    const cmd = yumemi.cmd[plugin_name];
    const { groups } = bot;
    const { group_id } = data;
    for (const fnc in cmd) {
        if (new RegExp(cmd[fnc]).test(data.raw_message)) {
            action = fnc;
            break;
        }
    }
    if (action && plugin_1.getPlugins().has(plugin_name) && /^(?!_).+/.test(plugin_name) && !groups[group_id].plugins.includes(plugin_name)) {
        action = '';
        data.reply(`${plugin_name} 服务未启用`);
    }
    return action;
}
exports.checkCommand = checkCommand;
/**
 * 删除文件
 * @param file_url 文件路径
 * @returns Promise 对象
 */
function deleteFile(file_url) {
    return new Promise((resolve, reject) => {
        fs_1.unlink(file_url, (err) => {
            !err ? resolve(null) : reject(err);
        });
    });
}
exports.deleteFile = deleteFile;
/**
 * 删除文件夹
 * @param folder_url 文件夹路径
 * @returns Promise 对象
 */
function deleteFolder(folder_url) {
    return new Promise(async (resolve, reject) => {
        const files = await fs_1.promises.readdir(folder_url);
        for (const file of files) {
            await fs_1.promises.unlink(`${folder_url}/${file}`);
        }
        // 删除文件夹
        fs_1.rmdir(folder_url, (err) => {
            !err ? resolve(null) : reject(err);
        });
    });
}
exports.deleteFolder = deleteFolder;
function httpNetwork(method, url, params = '') {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(params)
        };
        const options = {
            method,
            headers
        };
        const req = http_1.default.request(url, options, (res) => {
            let err = null;
            const contentType = res.headers['content-type'];
            // 任何 2xx 状态码都表示成功的响应
            if (Math.floor(res.statusCode / 100) !== 2)
                err = new Error(`请求失败，状态码: ${res.statusCode}`);
            if (err) {
                // 释放内存
                res.resume();
                reject(err);
            }
            switch (contentType) {
                case 'image/jpeg':
                case 'image/png':
                case 'image/jpg':
                    res.setEncoding('base64');
                    break;
                default:
                    res.setEncoding('utf8');
                    //   err = new Error(`无效的 content-type ，接收到的是 ${contentType}`);
                    break;
            }
            let raw_data = '';
            res.on('data', (chunk) => { raw_data += chunk; });
            res.on('end', () => {
                // 若 data 为 json 则转换
                if (/^application\/json/.test(contentType)) {
                    raw_data = JSON.parse(raw_data);
                }
                resolve(raw_data);
            });
        }).on('error', (err) => {
            reject(err);
        }).on('timeout', () => {
            reject(`Timeout: ${url}`);
        });
        // 将数据写入请求 body
        req.write(params);
        // 使用 request() 时，必须始终调用 req.end() 来表示请求的结束
        req.end();
    });
}
function httpsNetwork(method, url, params = '') {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(params)
        };
        const options = {
            method,
            headers
        };
        const req = https_1.default.request(url, options, (res) => {
            let err = null;
            const contentType = res.headers['content-type'];
            // 任何 2xx 状态码都表示成功的响应
            if (Math.floor(res.statusCode / 100) !== 2)
                err = new Error(`请求失败，状态码: ${res.statusCode}`);
            if (err) {
                // 释放内存
                res.resume();
                reject(err);
            }
            switch (contentType) {
                case 'image/jpeg':
                case 'image/png':
                case 'image/jpg':
                    res.setEncoding('base64');
                    break;
                default:
                    res.setEncoding('utf8');
                    //   err = new Error(`无效的 content-type ，接收到的是 ${contentType}`);
                    break;
            }
            let raw_data = '';
            res.on('data', (chunk) => { raw_data += chunk; });
            res.on('end', () => {
                // 若 data 为 json 则转换
                if (/^application\/json/.test(contentType)) {
                    raw_data = JSON.parse(raw_data);
                }
                resolve(raw_data);
            });
        }).on('error', (err) => {
            reject(err);
        }).on('timeout', () => {
            reject(`Timeout: ${url}`);
        });
        // 将数据写入请求 body
        req.write(params);
        // 使用 request() 时，必须始终调用 req.end() 来表示请求的结束
        req.end();
    });
}
/**
 * http 网络请求
 */
const httpRequest = {
    /**
     * 发起 http get 请求
     * @param url 网络请求 url
     * @param params url 参数
     */
    get: (url, params = '') => {
        return new Promise((resolve, reject) => {
            httpNetwork('GET', `${url}${params}`)
                .then(res => {
                resolve(res);
            })
                .catch(err => {
                reject(err);
            });
        });
    },
    /**
     * 发起 http post 请求
     * @param url 网络请求 url
     * @param params post 参数
     */
    post: (url, params) => {
        return new Promise((resolve, reject) => {
            httpNetwork('POST', url, params)
                .then(res => {
                resolve(res);
            })
                .catch(err => {
                reject(err);
            });
        });
    }
};
exports.httpRequest = httpRequest;
/**
 * https 网络请求
 */
const httpsRequest = {
    /**
     * 发起 https get 请求
     * @param url 网络请求 url
     * @param params url 参数
     */
    get: (url, params = '') => {
        return new Promise((resolve, reject) => {
            httpsNetwork('GET', `${url}${params}`)
                .then(res => {
                resolve(res);
            })
                .catch(err => {
                reject(err);
            });
        });
    },
    /**
     * 发起 https post 请求
     * @param url 网络请求 url
     * @param params post 参数
     */
    post: (url, params) => {
        return new Promise((resolve, reject) => {
            httpsNetwork('POST', url, params)
                .then(res => {
                resolve(res);
            })
                .catch(err => {
                reject(err);
            });
        });
    }
};
exports.httpsRequest = httpsRequest;
/**
 * 检测文件是否存在
 * @param path 文件路径
 * @returns Promise<boolean>
 */
async function checkFile(path) {
    let exists = false;
    await fs_1.promises.access(path)
        .then(() => {
        exists = true;
    })
        .catch(() => {
        exists = false;
    });
    return exists;
}
/**
 * 检测文件是否存在
 * @param path 文件路径
 * @returns boolean
 */
function checkFileSync(path) {
    try {
        fs_1.accessSync(path);
        return true;
    }
    catch (err) {
        return false;
    }
}
/**
 * 校验 groups
 * @param bot 机器人实例
 * @param plugin_list 机器人插件列表
 */
async function checkGroup(bot, plugin_list) {
    let update = false;
    const { uin, logger } = bot;
    const plugins = plugin_list.filter(plugin => /^(?!_).+/.test(plugin));
    const exists = await checkFile(`./config/groups/${uin}.yml`);
    const params = await getProfile('params');
    const groups = exists ? await getProfile(uin.toString(), './config/groups') : {};
    !exists && fs_1.writeFile(`./config/groups/${uin}.yml`, '', err => err && logger.error(err));
    // 获取群信息
    bot.groups = groups;
    bot.gl.forEach((val) => {
        const { group_id, group_name } = val;
        const { [group_id]: group } = groups;
        // 群信息存在并且插件设置键值对相同则 continue
        if (group && Object.keys(group.settings).length === plugins.length)
            return true;
        // 防止重复赋值
        if (!update)
            update = true;
        // 文件存在，校验数据是否更新
        if (group) {
            logger.info(`你可能添加了新的插件，正在更新群聊「${group_name} (${group_id})」配置文件...`);
        }
        else {
            logger.info(`检测到群聊 「${group_name} (${group_id})」 未初始化信息，正在写入数据...`);
            groups[group_id] = {
                name: group_name,
                plugins: [],
                settings: {},
            };
        }
        // 写入插件配置
        const settings = groups[group_id].settings;
        for (const plugin of plugins) {
            // 插件信息若存在将 continue 处理
            if (settings[plugin])
                continue;
            // 插件 lock 默认为 false
            settings[plugin] = {
                lock: false
            };
            // 插件存在多参则写入
            if (params[plugin]) {
                for (const param in params[plugin])
                    settings[plugin][param] = params[plugin][param];
            }
        }
    });
    if (update) {
        await setProfile(uin.toString(), groups, './config/groups')
            .then(() => {
            logger.mark(`已更新 ${uin}.yml 配置文件 ♪`);
        })
            .catch(err => {
            logger.error(err);
        });
    }
    else {
        logger.mark(`校验完毕，${uin}.yml 无需更新 ♪`);
    }
}
exports.checkGroup = checkGroup;
/**
 * level 0 群成员
 * level 1 群成员
 * level 2 群成员
 * level 3 管  理
 * level 4 群  主
 * level 5 主  人
 * level 6 维护组
 */
function getLevel(data, bot) {
    return new Promise((resolve, reject) => {
        const { admin } = yumemi.info;
        const { masters } = bot;
        const { user_id, sender: { level, role } } = data;
        resolve(!admin.includes(user_id) ? (!masters.includes(user_id) ? (role === 'member' ? (level <= 4 ? (level <= 2 ? 0 : 1) : 2) : (role === 'admin' ? 3 : 4)) : 5) : 6);
    });
}
exports.getLevel = getLevel;
