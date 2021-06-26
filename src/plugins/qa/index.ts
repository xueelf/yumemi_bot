import { Client, GroupMessageEventData } from "oicq";
import { checkCommand } from "../../utils/yumemi";
import querystring from 'querystring'
import { httpRequest } from '../../utils/network'

const qa_url = `http://localhost/api/word`;

function getWord(group_id: number) {
  return new Promise((resolve, reject) => {
    const params = querystring.stringify({
      data: [group_id]
    });

    httpRequest.post(`${qa_url}/get_word`, params)
      .then((res: any) => {
        resolve(res);
      })
      .catch((err: Error) => {
        yumemi.logger.error(err);
        reject(err);
      })
  })
}

function answer(data: GroupMessageEventData) {
  const { group_id, raw_message, reply } = data;

  getWord(group_id)
    .then((data: any) => {
      for (const word of data) {
        const reg = new RegExp(word.question);

        if (!reg.test(raw_message)) continue;

        reply(word.answer);
      }
    })
    .catch(err => {
      reply(err);
    })
}

function question(data: GroupMessageEventData) {
  const { group_id, raw_message, reply } = data;
  const [question, answer] = <string[]>raw_message.match(/(?<=有人(问|说)).+(?=你就?(回|答|说|告诉他|告诉她))|(?<=你就?(回|答|说|告诉他|告诉她)).+/g);
  const regular = /(\^|\$)/.test(question) ? question : `^${question}$`;
  const params = querystring.stringify({
    data: [group_id, regular, answer] as string[]
  });

  httpRequest.post(`${qa_url}/set_word`, params)
    .then(() => {
      reply('好的，我记住了');
    })
    .catch((err: Error) => {
      yumemi.logger.error(err);
      reply(err.message);
    })
}

function select(data: GroupMessageEventData) {
  const { group_id, reply } = data;

  getWord(group_id)
    .then((data: any) => {
      const msg = ['id    lock      question', '------------------------'];

      for (const word of data) {
        const { id, question, lock } = word;
        msg.push(`${id}      ${!lock ? 'false' : 'true'}        ${question}`)
      };

      reply(msg.join('\n'));
    })
    .catch(err => {
      reply(err);
    })
}

function qa(bot: Client, data: GroupMessageEventData): void {
  const { qa } = yumemi.cmd;
  const { groups } = bot;
  const { group_id, raw_message } = data;

  if (!groups[group_id].plugins.includes('qa')) {
    return
  }

  checkCommand(raw_message, qa.answer) && answer(data);
  checkCommand(raw_message, qa.question) && question(data);
  checkCommand(raw_message, qa.select) && select(data);
}

function activate(bot: Client): void {
  bot.on("message.group", (data: GroupMessageEventData) => qa(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("message.group", qa);
}

export {
  activate, deactivate
}