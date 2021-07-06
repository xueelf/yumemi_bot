const { stringify } = require('querystring');
const { checkCommand, httpRequest } = require('../../dist/util');

const qa_url = `http://localhost/api/word`;

function getWord(group_id) {
  return new Promise((resolve, reject) => {
    const params = stringify({
      data: [group_id]
    });

    httpRequest.post(`${qa_url}/get_word`, params)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        yumemi.logger.error(err);
        reject(err);
      })
  })
}

function answer(data) {
  const { group_id, raw_message, reply } = data;

  getWord(group_id)
    .then(data => {
      for (const word of data) {
        const question = word.question;
        const reg = new RegExp(/(\^|\$)/.test(question) ? question : `^${question}$`);

        if (!reg.test(raw_message)) continue;

        reply(word.answer);
      }
    })
    .catch(err => {
      reply(err);
    })
}

function question(data) {
  const { group_id, raw_message, reply } = data;
  const [question, answer] = raw_message.match(/(?<=有人(问|说)).+(?=你就?(回|答|说|告诉他|告诉她))|(?<=你就?(回|答|说|告诉他|告诉她)).+/g);
  const params = stringify({
    data: [
      group_id,
      question,
      // !/CQ:image/.test(regular) ? regular : (regular.match(/(?<=file=).+(?=,)/g))[0].replace(/(\.|\\|\+|\*|\?|\[|\^|\]|\$|\(|\)|\{|\}|\/)/g, '\\$1'),
      answer
    ]
  });

  httpRequest.post(`${qa_url}/set_word`, params)
    .then(() => {
      reply('好的，我记住了');
    })
    .catch((err) => {
      yumemi.logger.error(err);
      reply(err.message);
    })
}

function select(data) {
  const { group_id, reply } = data;

  getWord(group_id)
    .then((data) => {
      const msg = [];

      for (const word of data) {
        const { question } = word;

        msg.push(question);
      };

      reply('当前群自定义问答：\n\t' + msg.join(' | '));
    })
    .catch(err => {
      reply(err);
    })
}

function deleteWord() {

}

function listener(data) {
  const action = checkCommand('qa', data, this);

  answer(data);
  action && eval(`${action}(data, this)`);
}

function activate(bot) {
  bot.on("message.group", listener);
}

function deactivate(bot) {
  bot.off("message.group", listener);
}

module.exports = {
  activate, deactivate
}