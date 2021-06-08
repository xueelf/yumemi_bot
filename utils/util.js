const fs = require('fs');
const http = require('http');
const https = require('https');
const yaml = require('js-yaml');
const schedule = require('node-schedule');

const config_path = `./config`;

const httpRequest = (url, method, post_data = '') => {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(post_data)
    }
    const options = {
      method,
      headers
    }
    const req = http.request(url, options, res => {
      let err = null;
      const contentType = res.headers['content-type'];

      // 任何 2xx 状态码都表示成功的响应
      if (Math.floor(res.statusCode / 100) !== 2) err = new Error(`请求失败，状态码: ${res.statusCode}`);

      if (err) {
        bot.logger.error(`Error: ${err.message}`);
        // 释放内存
        res.resume();
        return;
      }

      res.setEncoding('utf8');

      let raw_data = '';

      res.on('data', (chunk) => { raw_data += chunk; });
      res.on('end', () => {
        // 若 data 为 json 则转换
        if (/^application\/json/.test(contentType)) {
          raw_data = JSON.parse(raw_data);
        }

        resolve(raw_data)
      });
    }).on('error', err => {
      reject(err);
    }).on('timeout', () => {
      bot.logger.warn(`Timeout: ${url}`);
      reject(null);
    });

    // 将数据写入请求 body
    req.write(post_data);
    // 使用 request() 时，必须始终调用 req.end() 来表示请求的结束
    req.end();
  })
}


// 发送 https get 请求
// 这个方法近期会重写
const httpsRequest = {
  get: async (url, options = { timeout: 5000 }) => {
    return new Promise((resolve, reject) => {
      https.get(url, options, res => {
        let err = null;

        const { statusCode } = res;
        const contentType = res.headers['content-type'];
        // bot.logger.mark(`statusCode: ${statusCode}, contentType: ${contentType}, url: ${url}`);

        // 任何 2xx 状态码都表示成功的响应
        if (Math.floor(statusCode / 100) !== 2) err = new Error(`请求失败，状态码: ${statusCode}`);

        // bot.logger.debug(`contentType: ${contentType}`);

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

        if (err) {
          bot.logger.error(`Error: ${err.message}`);
          // 释放内存
          res.resume();
          return;
        }

        let rawData = '';

        res.on('data', chunk => { rawData += chunk; });
        res.on('end', () => {
          // 若 data 为 json 则转换
          if (/^application\/json/.test(contentType)) {
            rawData = JSON.parse(rawData);
          }

          resolve(rawData)
        });
      }).on('error', err => {
        reject(err);
      }).on('timeout', () => {
        bot.logger.warn(`Timeout: ${url}`);
        reject(null);
      });
    })
  }
}

/**
 * async 获取配置文件信息
 * 
 * @param {string} file_name 文件名（不包括后缀）
 * @param {string} [file_folder=config_path] 文件夹路径
 */

const getConfig = (file_name, file_folder = config_path) => {
  return new Promise((resolve, reject) => {
    const file_path = `${file_folder}/${file_name}.yml`;

    fs.readFile(file_path, (err, data) => {
      !err ? resolve(yaml.load(data)) : reject(err);
    });
  });
}

/**
 * await 获取配置文件信息
 * 
 * @param {string} file_name - 文件名（不包括后缀）
 * @param {string} [file_folder=config_path] - 文件夹路径
 */
const getConfigSync = (file_name, file_folder = config_path) => {
  const file_path = `${file_folder}/${file_name}.yml`;

  try {
    return yaml.load(fs.readFileSync(file_path));
  } catch (err) {
    throw err;
  }
}

/**
 * async 写入配置文件
 * 
 * @param {string} file_name 文件名（不包括后缀）
 * @param {object} data 文件数据
 * @param {string} [file_folder=config_path] 文件夹路径
 */
const setConfig = (file_name, data, file_folder = config_path) => {
  return new Promise((resolve, reject) => {
    const file_path = `${file_folder}/${file_name}.yml`;

    fs.writeFile(file_path, yaml.dump(data), err => {
      !err ?
        resolve(
          bot.logger.info(`已更新 ${file_name}.yml 配置文件 ♪`)
        ) :
        reject(err);
    });
  })
}

/**
 * async 获取文件目录
 * 
 * @param {string} folder 文件夹名
 */
const getDir = folder => {
  return new Promise((resolve, reject) => {
    let dir = null;

    // 这里必须是 Sync ，因为返回的数据类型不固定，待优化
    switch (folder) {
      case 'plugins':
        // dir = fs.readdirSync(`${__yumemi}/plugins`).filter(plugin => /^[a-z]+$/.test(plugin));
        dir = fs.readdirSync(`./plugins`);
        break;

      case 'setu':
        dir = {
          r17: fs.readdirSync(`./data/images/setu/r17`),
          r18: fs.readdirSync(`./data/images/setu/r18`),
        };
        break;
      case 'rank':
        dir = fs.readdirSync(`./data/images/rank`);
        break;

      default:
        reject(new Error(`${folder} is not a parameter`))
        break;
    }

    resolve(dir);
  })
}

/**
 * schedule 定时任务
 */
const scheduleJob = schedule.scheduleJob;

/**
 * async 检测文件是否存在
 * 
 * @param {string} path - 文件路径
 */
const exists = path => {
  return new Promise((resolve, reject) => {
    fs.access(path, err => {
      !err ? resolve() : reject(err);
    });
  });
}

/**
 * async 校验群配置文件
 */
const checkGroupConfig = async () => {
  let update = false;

  // 不处理静态模块
  const plugins = await getDir('plugins').then(data => data.filter(plugin => /^(?!_).+/.test(plugin)));
  const params = await getConfig('params');
  const groups = await getConfig('groups') || {};

  bot.gl.forEach(val => {
    // 获取群信息
    const { group_id, group_name } = val;

    // 群信息存在并且插件数相同则 continue
    if (groups[group_id] && Object.keys(groups[group_id].plugins).length === plugins.length) return true;
    if (!update) update = true;
    if (groups[group_id]) {
      bot.logger.info(`你可能添加了新的插件，正在更新群聊「${group_name} (${group_id})」配置文件...`);
    } else {
      bot.logger.info(`检测到群聊 「${group_name} (${group_id})」 未初始化信息，正在写入数据...`);

      groups[group_id] = {};
      groups[group_id].name = group_name;
      groups[group_id].enable = false;
      groups[group_id].plugins = {};
    }

    // 写入插件配置
    for (const plugin of plugins) {
      // 插件若是存在将 continue 处理
      if (groups[group_id].plugins[plugin]) continue;

      groups[group_id].plugins[plugin] = {};
      // 插件 enable 默认为 true
      groups[group_id].plugins[plugin].enable = true;

      // 插件存在多参则写入
      if (params[plugin]) {
        for (const param in params[plugin]) groups[group_id].plugins[plugin][param] = params[plugin][param];
      }
    }
  })

  update && await setConfig('groups', groups);
}

module.exports = {
  getConfig, getConfigSync, setConfig,
  getDir, exists, checkGroupConfig,
  scheduleJob, httpsRequest, httpRequest
}