"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = require("sqlite3");
const sqlite3 = sqlite3_1.verbose();
const db = new sqlite3.Database(`${path.db}/yumemi.db`);
db.exec('PRAGMA foreign_keys = ON');
function get(sql, params) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            !err ? resolve(row) : yumemi.logger.error(err.message), reject(err);
        });
    });
}
function all(sql, params) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            !err ? resolve(rows) : yumemi.logger.error(err.message), reject(err);
        });
    });
}
function run(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, err => {
            !err ? resolve('ok') : yumemi.logger.error(err.message), reject(err);
        });
    });
}
exports.default = {
    get, all, run
};
