"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFileSync = exports.setProfile = exports.getProfileSync = exports.getProfile = void 0;
const js_yaml_1 = require("js-yaml");
const fs_1 = require("fs");
/**
 * 更新配置文件
 * @param file_name 文件名（不包括后缀）
 * @param data 文件 yaml 对象
 * @param file_folder 文件夹路径
 * @returns Promise 对象
 */
function setProfile(file_name, data, file_folder = path.config) {
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
function getProfile(file_name, file_folder = path.config) {
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
function getProfileSync(file_name, file_folder = path.config) {
    const file_path = `${file_folder}/${file_name}.yml`;
    try {
        return js_yaml_1.load(fs_1.readFileSync(file_path, 'utf-8')) || {};
    }
    catch (err) {
        throw err;
    }
}
exports.getProfileSync = getProfileSync;
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
exports.checkFileSync = checkFileSync;
