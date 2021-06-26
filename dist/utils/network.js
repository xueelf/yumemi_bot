"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpsRequest = exports.httpRequest = void 0;
const http = __importStar(require("http"));
const https = __importStar(require("https"));
function httpNetwork(method, url, params = '') {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(params)
        };
        const options = {
            method,
            headers
        };
        const req = http.request(url, options, (res) => {
            let err = null;
            const contentType = res.headers['content-type'];
            // 任何 2xx 状态码都表示成功的响应
            if (Math.floor(res.statusCode / 100) !== 2)
                err = new Error(`请求失败，状态码: ${res.statusCode}`);
            if (err) {
                // 释放内存
                res.resume();
                reject(err);
            }
            switch (contentType) {
                case 'image/jpeg':
                case 'image/png':
                case 'image/jpg':
                    res.setEncoding('base64');
                    break;
                default:
                    res.setEncoding('utf8');
                    //   err = new Error(`无效的 content-type ，接收到的是 ${contentType}`);
                    break;
            }
            let raw_data = '';
            res.on('data', (chunk) => { raw_data += chunk; });
            res.on('end', () => {
                // 若 data 为 json 则转换
                if (/^application\/json/.test(contentType)) {
                    raw_data = JSON.parse(raw_data);
                }
                resolve(raw_data);
            });
        }).on('error', (err) => {
            reject(err);
        }).on('timeout', () => {
            reject(`Timeout: ${url}`);
        });
        // 将数据写入请求 body
        req.write(params);
        // 使用 request() 时，必须始终调用 req.end() 来表示请求的结束
        req.end();
    });
}
function httpsNetwork(method, url, params = '') {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(params)
        };
        const options = {
            method,
            headers
        };
        const req = https.request(url, options, (res) => {
            let err = null;
            const contentType = res.headers['content-type'];
            // 任何 2xx 状态码都表示成功的响应
            if (Math.floor(res.statusCode / 100) !== 2)
                err = new Error(`请求失败，状态码: ${res.statusCode}`);
            if (err) {
                // 释放内存
                res.resume();
                reject(err);
            }
            switch (contentType) {
                case 'image/jpeg':
                case 'image/png':
                case 'image/jpg':
                    res.setEncoding('base64');
                    break;
                default:
                    res.setEncoding('utf8');
                    //   err = new Error(`无效的 content-type ，接收到的是 ${contentType}`);
                    break;
            }
            let raw_data = '';
            res.on('data', (chunk) => { raw_data += chunk; });
            res.on('end', () => {
                // 若 data 为 json 则转换
                if (/^application\/json/.test(contentType)) {
                    raw_data = JSON.parse(raw_data);
                }
                resolve(raw_data);
            });
        }).on('error', (err) => {
            reject(err);
        }).on('timeout', () => {
            reject(`Timeout: ${url}`);
        });
        // 将数据写入请求 body
        req.write(params);
        // 使用 request() 时，必须始终调用 req.end() 来表示请求的结束
        req.end();
    });
}
/**
 * http 网络请求
 */
const httpRequest = {
    /**
     * 发起 http get 请求
     * @param url 网络请求 url
     * @param params url 参数
     */
    get: (url, params = '') => {
        return new Promise((resolve, reject) => {
            httpNetwork('GET', `${url}${params}`)
                .then(res => {
                resolve(res);
            })
                .catch(err => {
                reject(err);
            });
        });
    },
    /**
     * 发起 http post 请求
     * @param url 网络请求 url
     * @param params post 参数
     */
    post: (url, params) => {
        return new Promise((resolve, reject) => {
            httpNetwork('POST', url, params)
                .then(res => {
                resolve(res);
            })
                .catch(err => {
                reject(err);
            });
        });
    }
};
exports.httpRequest = httpRequest;
/**
 * https 网络请求
 */
const httpsRequest = {
    /**
     * 发起 https get 请求
     * @param url 网络请求 url
     * @param params url 参数
     */
    get: (url, params = '') => {
        return new Promise((resolve, reject) => {
            httpsNetwork('GET', `${url}${params}`)
                .then(res => {
                resolve(res);
            })
                .catch(err => {
                reject(err);
            });
        });
    },
    /**
     * 发起 https post 请求
     * @param url 网络请求 url
     * @param params post 参数
     */
    post: (url, params) => {
        return new Promise((resolve, reject) => {
            httpsNetwork('POST', url, params)
                .then(res => {
                resolve(res);
            })
                .catch(err => {
                reject(err);
            });
        });
    }
};
exports.httpsRequest = httpsRequest;
