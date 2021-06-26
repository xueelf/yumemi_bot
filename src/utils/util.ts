import { load, dump } from 'js-yaml';
import { writeFile, readFile, readFileSync, accessSync } from 'fs';

import { IProfile } from '../types/bot';

/**
 * 更新配置文件
 * @param file_name 文件名（不包括后缀）
 * @param data 文件 yaml 对象
 * @param file_folder 文件夹路径
 * @returns Promise 对象
 */
function setProfile(file_name: string, data: IProfile, file_folder: string = path.config): Promise<void | Error> {
  return new Promise((resolve, reject) => {
    const file_path: string = `${file_folder}/${file_name}.yml`;

    writeFile(file_path, dump(data), err => {
      !err ? resolve() : reject(err);
    });
  });
}

/**
 * async 获取配置文件
 * @param file_name 文件名（不包括后缀）
 * @param file_folder 文件夹路径
 * @returns 返回 Promise 对象
 */
function getProfile(file_name: string, file_folder: string = path.config): Promise<IProfile> {
  return new Promise((resolve, reject) => {
    const file_path: string = `${file_folder}/${file_name}.yml`;

    readFile(file_path, 'utf-8', (err, data) => {
      !err ? resolve(<IProfile>load(data) || {}) : reject(err);
    });
  });
}

/**
 * await 获取配置文件
 * @param file_name 文件名（不包括后缀）
 * @param file_folder 文件夹路径
 * @returns 返回 JSON 对象
 */
function getProfileSync(file_name: string, file_folder: string = path.config): IProfile {
  const file_path: string = `${file_folder}/${file_name}.yml`;

  try {
    return <IProfile>load(readFileSync(file_path, 'utf-8')) || {};
  } catch (err) {
    throw err;
  }
}

/**
 * 检测文件是否存在
 * @param path 文件路径
 * @returns boolean
 */
function checkFileSync(path: string): boolean {
  try {
    accessSync(path);
    return true;
  } catch (err) {
    return false;
  }
}



/**
 * 
 * @param bot bot 实例
 * @param plugins 插件目录 
 */
// function enablePlugin(bot: Client, plugins: string[]): void {
//   for (const plugin of plugins) {
//     bot.plugins.get(plugin)?.enable(bot);
//   }
// }





export {
  getProfile, getProfileSync, setProfile, checkFileSync
}