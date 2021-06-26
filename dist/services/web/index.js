"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const router_1 = __importDefault(require("./router"));
const util_1 = require("../../utils/util");
const app = new koa_1.default();
const logger = yumemi.logger;
app.use(async (ctx, next) => {
    await next();
    logger.info(`Process ${ctx.request.method} ${ctx.request.url}`);
    ctx.status === 404 && ctx.redirect('/error');
});
app.use(router_1.default.routes());
util_1.getProfile('web')
    .then(data => {
    const { port, domain } = data;
    // 在端口监听
    app.listen(port, () => {
        logger.info(`web serve started at ${domain ? domain : 'localhost'}:${port}`);
    });
})
    .catch(err => {
    throw err;
});
