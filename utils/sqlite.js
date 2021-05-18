const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(`${__yumemi}/data/db/yumemi.db`);

const get = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      !err ? resolve(row) : bot.logger.error(err.message), reject(err);
    });
  })
}

const all = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      !err ? resolve(rows) : bot.logger.error(err.message), reject(err);
    });
  })
}

const run = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, err => {
      !err ? resolve('ok') : bot.logger.error(err.message), reject(err);
    });
  })
}

module.exports = { get, all, run }