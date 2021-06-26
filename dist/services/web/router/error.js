"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const error = new koa_router_1.default();
error.get('/', async (ctx) => {
    ctx.body = '你不该来这里';
});
exports.default = error;
