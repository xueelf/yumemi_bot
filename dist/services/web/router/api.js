"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const util_1 = require("../../../utils/util");
// import { getProfileSync } from "../../../utils/util";
const sqlite_1 = __importDefault(require("../../../utils/sqlite"));
const api = new koa_router_1.default();
const sql = util_1.getProfileSync('sql');
api.use(koa_bodyparser_1.default());
api.get('/', async (ctx) => {
    ctx.body = 'api';
});
api.post('/word/:action', async (ctx) => {
    let action = null;
    const { data } = ctx.request.body;
    switch (ctx.params.action) {
        case 'set_word':
            action = 'run';
            break;
        case 'get_word':
            action = 'all';
            break;
    }
    action && await sqlite_1.default[action](sql[ctx.params.action], data)
        .then(data => {
        ctx.status = 200;
        ctx.body = data;
    })
        .catch(err => {
        ctx.status = 500;
        ctx.body = err;
        yumemi.logger.error(err);
    });
});
api.post('/guess/:action', async (ctx) => {
    let action = null;
    const { data } = ctx.request.body;
    switch (ctx.params.action) {
        case 'get_unit':
            action = 'get';
            break;
    }
    action && await sqlite_1.default[action](sql[ctx.params.action], data)
        .then((data) => {
        ctx.status = 200;
        ctx.body = data;
    })
        .catch((err) => {
        ctx.status = 500;
        ctx.body = err;
        yumemi.logger.error(err);
    });
});
api.post('/battle/:action', async (ctx) => {
    let action = null;
    const { data } = ctx.request.body;
    switch (ctx.params.action) {
        case 'get_user':
        case 'get_groups':
        case 'get_member':
        case 'get_now_battle':
            action = 'get';
            break;
        case 'set_user':
        case 'set_groups':
        case 'set_member':
        case 'set_battle':
        case 'delete_battle':
        case 'set_beat':
        case 'update_battle':
        case 'reservation':
        case 'update_beat':
        case 'delete_beat':
            action = 'run';
            break;
        case 'get_now_beat':
            action = 'all';
            break;
    }
    action && await sqlite_1.default[action](sql[ctx.params.action], data)
        .then((data) => {
        ctx.status = 200;
        ctx.body = data;
    })
        .catch((err) => {
        ctx.status = 500;
        ctx.body = err;
        yumemi.logger.error(err);
    });
});
// // const sqlite = require(`${__yumemi}/utils/sqlite`);
// const sql = getConfigSync('sql');
// api.post('/word/:action', async ctx => {
//   let action = null;
//   const { params } = ctx.request.body;
//   switch (ctx.params.action) {
//     case 'set_word':
//       action = 'run';
//       break;
//     case 'get_word':
//       action = 'all';
//       break;
//   }
//   action && await sqlite[action](sql[ctx.params.action], params)
//     .then(data => {
//       ctx.status = 200;
//       ctx.body = data;
//     })
//     .catch(err => {
//       ctx.status = 500;
//       ctx.body = err;
//       bot.logger.error(err);
//     })
// })
// api.post('/guess/:action', async ctx => {
//   let action = null;
//   const { params } = ctx.request.body;
//   switch (ctx.params.action) {
//     case 'get_unit':
//       action = 'get';
//       break;
//   }
//   action && await sqlite[action](sql[ctx.params.action], params)
//     .then(data => {
//       ctx.status = 200;
//       ctx.body = data;
//     })
//     .catch(err => {
//       ctx.status = 500;
//       ctx.body = err;
//       bot.logger.error(err);
//     })
// })
// api.post('/battle/:action', async ctx => {
//   let action = null;
//   const { params } = ctx.request.body;
//   switch (ctx.params.action) {
//     case 'get_user':
//     case 'get_groups':
//     case 'get_member':
//     case 'get_now_battle':
//       action = 'get';
//       break;
//     case 'set_user':
//     case 'set_groups':
//     case 'set_member':
//     case 'set_battle':
//     case 'delete_battle':
//     case 'set_beat':
//     case 'update_battle':
//     case 'reservation':
//     case 'update_beat':
//       action = 'run';
//       break;
//     case 'get_now_beat':
//       action = 'all';
//       break;
//   }
//   action && await sqlite[action](sql[ctx.params.action], params)
//     .then(data => {
//       ctx.status = 200;
//       ctx.body = data;
//     })
//     .catch(err => {
//       ctx.status = 500;
//       ctx.body = err;
//       bot.logger.error(err);
//     })
// })
// api.post('/send/:target', async ctx => {
//   const { target } = ctx.params;
//   if (target !== 'private' && target !== 'group') {
//     ctx.status = 404;
//     return;
//   }
//   const { user_id, group_id, msg } = ctx.request.body;
//   if (user_id && group_id || !user_id && !group_id || !msg) {
//     ctx.status = 400;
//     return;
//   }
//   // 1分钟同一 ip 调用100次直接 ban 掉
//   //...
//   const { fl, gl } = bot;
//   switch (target) {
//     case 'private':
//       fl.has(user_id) ?
//         (
//           ctx.status = 200,
//           bot.sendPrivateMsg(user_id, msg)
//         ) :
//         ctx.status = 403
//       break;
//     case 'group':
//       gl.has(group_id) ?
//         (
//           ctx.status = 200,
//           bot.sendGroupMsg(group_id, msg)
//         ) :
//         ctx.status = 403
//       break;
//   }
// })
exports.default = api;
