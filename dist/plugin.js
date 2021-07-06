"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlugins = void 0;
const fs_1 = require("fs");
const plugins = new Map();
(async () => {
    for (const plugin of await fs_1.promises.readdir('./plugins')) {
        // 目录是否存在 index 文件
        try {
            fs_1.accessSync(`./plugins/${plugin}/index.js`);
            plugins.set(plugin, require(`../plugins/${plugin}`));
        }
        catch (err) {
            yumemi.logger.warn(err);
        }
    }
})();
function getPlugins() {
    return plugins;
}
exports.getPlugins = getPlugins;
