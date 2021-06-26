"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const yumemi_1 = require("../../utils/yumemi");
const querystring_1 = __importDefault(require("querystring"));
const network_1 = require("../../utils/network");
const qa_url = `http://localhost/api/word`;
function getWord(group_id) {
    return new Promise((resolve, reject) => {
        const params = querystring_1.default.stringify({
            data: [group_id]
        });
        network_1.httpRequest.post(`${qa_url}/get_word`, params)
            .then((res) => {
            resolve(res);
        })
            .catch((err) => {
            yumemi.logger.error(err);
            reject(err);
        });
    });
}
function answer(data) {
    const { group_id, raw_message, reply } = data;
    getWord(group_id)
        .then((data) => {
        for (const word of data) {
            const reg = new RegExp(word.question);
            if (!reg.test(raw_message))
                continue;
            reply(word.answer);
        }
    })
        .catch(err => {
        reply(err);
    });
}
function question(data) {
    const { group_id, raw_message, reply } = data;
    const [question, answer] = raw_message.match(/(?<=有人(问|说)).+(?=你就?(回|答|说|告诉他|告诉她))|(?<=你就?(回|答|说|告诉他|告诉她)).+/g);
    const regular = /(\^|\$)/.test(question) ? question : `^${question}$`;
    const params = querystring_1.default.stringify({
        data: [group_id, regular, answer]
    });
    network_1.httpRequest.post(`${qa_url}/set_word`, params)
        .then(() => {
        reply('好的，我记住了');
    })
        .catch((err) => {
        yumemi.logger.error(err);
        reply(err.message);
    });
}
function select(data) {
    const { group_id, reply } = data;
    getWord(group_id)
        .then((data) => {
        const msg = ['id    lock      question', '------------------------'];
        for (const word of data) {
            const { id, question, lock } = word;
            msg.push(`${id}      ${!lock ? 'false' : 'true'}        ${question}`);
        }
        ;
        reply(msg.join('\n'));
    })
        .catch(err => {
        reply(err);
    });
}
function qa(bot, data) {
    const { qa } = yumemi.cmd;
    const { groups } = bot;
    const { group_id, raw_message } = data;
    if (!groups[group_id].plugins.includes('qa')) {
        return;
    }
    yumemi_1.checkCommand(raw_message, qa.answer) && answer(data);
    yumemi_1.checkCommand(raw_message, qa.question) && question(data);
    yumemi_1.checkCommand(raw_message, qa.select) && select(data);
}
function activate(bot) {
    bot.on("message.group", (data) => qa(bot, data));
}
exports.activate = activate;
function deactivate(bot) {
    bot.off("message.group", qa);
}
exports.deactivate = deactivate;
