"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const api_1 = __importDefault(require("./api"));
const error_1 = __importDefault(require("./error"));
const webhook_1 = __importDefault(require("./webhook"));
const router = new koa_router_1.default();
router.use('/api', api_1.default.routes());
router.use('/error', error_1.default.routes());
router.use('/webhook', webhook_1.default.routes());
exports.default = router;
