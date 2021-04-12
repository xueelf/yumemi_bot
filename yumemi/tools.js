const fs = require('fs');
const https = require('https');
const yaml = require('js-yaml');
const schedule = require('node-schedule');
const sqlite3 = require('sqlite3').verbose();

// sqlite3
class SQL {
  constructor(sql, param) {
    this.db = new sqlite3.Database(`${__yumemi}/data/db/yumemi.db`);
    this.sql = sql;
    this.param = param;
  }

  run() {
    return new Promise((resolve, reject) => {
      this.db.run(this.sql, this.param, err => {
        this.db.close(() => {
          bot.logger.mark('数据库连接已关闭')
        });
        !err ? resolve() : reject(err);
      });
    })
  }

  all() {
    return new Promise((resolve, reject) => {
      this.db.all(this.sql, this.param, (err, rows) => {
        this.db.close(() => {
          bot.logger.mark('数据库连接已关闭')
        });
        !err ? resolve(rows) : reject(err);
      });
    });
  }

  get() {
    return new Promise((resolve, reject) => {
      this.db.get(this.sql, this.param, (err, row) => {
        this.db.close(() => {
          bot.logger.mark('数据库连接已关闭')
        });
        !err ? resolve(row) : reject(err);
      });
    });
  }
}


// 创建定时任务
const scheduleJob = schedule.scheduleJob;

// 获取 YAML 文件信息，若不传 path 默认 config 目录
const getYAML = (profile, path = `${__yumemi}/config`) => {
  return yaml.load(
    fs.readFileSync(`${path}/${profile}.yml`, 'utf-8')
  );
}

// 写入 YAML
const setYAML = (profile, data, path = `${__yumemi}/config`) => {
  try {
    fs.writeFileSync(`${path}/${profile}.yml`, yaml.dump(data));
    bot.logger.info(`已更新 ${profile}.yml 配置文件 ♪`);
  } catch (err) {
    throw err;
  }
};

// 获取文件目录
const getDir = (folder) => {
  let folders = null;

  switch (folder) {
    case 'plugins':
      folders = fs.readdirSync(`${__yumemi}/plugins`);
      break;

    case 'buy':
      folders = fs.readdirSync(`${__yumemi}/data/images/buy`);
      break;

    case 'setu':
      folders = {
        r17: fs.readdirSync(`${__yumemi}/data/images/setu/r17`),
        r18: fs.readdirSync(`${__yumemi}/data/images/setu/r18`),
      };
      break;

    default:
      throw new Error(`${folder} is not a parameter`)
  }

  return folders;
}

// 文件是否存在
const exists = (path) => {
  try {
    fs.accessSync(path);
    return true;
  } catch (err) {
    return false;
  }
}

// 发送 https get 请求
// 不会吧不会吧？都1202年了，不会还有 api 是 http 协议吧？
const getHttps = async (url, options = { timeout: 5000 }) => {
  return new Promise((resolve, reject) => {
    https.get(url, options, res => {
      let err = null;
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
      // bot.logger.mark(`statusCode: ${statusCode}, contentType: ${contentType}, url: ${url}`);

      // 任何 2xx 状态码都表示成功的响应
      if (Math.floor(statusCode / 100) !== 2) err = new Error(`请求失败，状态码: ${statusCode}`);

      switch (contentType) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/jpg':
          res.setEncoding('binary');
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
    }).on('error', (err) => {
      reject(err);
    }).on('timeout', () => {
      bot.logger.warn(`Timeout: ${url}`);
      reject();
    });
  })
}

module.exports = {
  SQL,
  scheduleJob,
  getYAML,
  setYAML,
  exists,
  getDir,
  getHttps,
}