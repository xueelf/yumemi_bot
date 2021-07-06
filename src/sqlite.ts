import { verbose } from 'sqlite3';

const sqlite3 = verbose();
const db = new sqlite3.Database('./data/db/yumemi.db');

db.exec('PRAGMA foreign_keys = ON');

function get(sql: string, params: any) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      !err ? resolve(row) : yumemi.logger.error(err.message), reject(err);
    });
  })
}

function all(sql: string, params: any) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      !err ? resolve(rows) : yumemi.logger.error(err.message), reject(err);
    });
  })
}

function run(sql: string, params: any) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, err => {
      !err ? resolve('ok') : yumemi.logger.error(err.message), reject(err);
    });
  })
}

export {
  get, all, run
}