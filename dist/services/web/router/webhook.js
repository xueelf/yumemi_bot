"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const webhook = new koa_router_1.default();
webhook.use(koa_bodyparser_1.default());
webhook.post('/', async (ctx) => {
    ctx.status = 200;
    const event = ctx.request.header['x-github-event'];
    switch (event) {
        case 'push':
            const { ref, repository: { full_name }, head_commit: { message, timestamp, url, author: { name }, committer: { username } } } = ctx.request.body;
            if (ref !== 'refs/heads/master') {
                // console.log(`${ref} 分支有新的提交，但不是 master 分支，不会推送`);
                return;
            }
            const commit = message.split('\n\n');
            const pushInfo = `Received a push event for ${full_name} to ${ref}
Summary: ${commit[0]}
Description: 
\t${commit[1].replace(/\n/g, '\n\t')}
Author: ${name}
Committer: ${username}
Updated: ${timestamp}
Link: ${url}`;
            bots.forEach(val => {
                const { gl, sendGroupMsg } = val;
                gl.forEach((val) => {
                    const { group_id } = val;
                    sendGroupMsg(group_id, pushInfo);
                });
            });
            break;
    }
});
exports.default = webhook;
