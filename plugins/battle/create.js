const querystring = require('querystring');
const battle_url = `http://localhost/api/battle`;
const { httpRequest } = require('../../dist/util');

// 创建账号信息
function insertUser(data) {
  return new Promise((resolve, reject) => {
    const { user_id, sender: { nickname } } = data;
    const params = querystring.stringify({
      data: [user_id]
    });

    // 查询账号是否存在
    httpRequest.post(`${battle_url}/get_user`, params)
      .then(res => {
        // return 不可省略，否则代码会继续执行
        if (res.length) return resolve();

        const params = querystring.stringify({
          data: [user_id, nickname]
        });

        // 账号不存在则写入数据
        httpRequest.post(`${battle_url}/set_user`, params)
          .then(() => {
            global.yumemi.logger.info(`INSERT user succrss: ${user_id}`);
            resolve();
          })
          .catch(err => {
            reject(err);
          })
      })
      .catch(err => {
        reject(err);
      })
  })

  // let password = '';

  // // 生成随机密码，小写字母 'a' 的 ASCII 是 97 , a-z 的 ASCII 码就是 97 + 0 ~ 25;
  // for (let i = 0; i <= 5; i++) password += (String.fromCharCode(97 + Math.floor(Math.random() * 26)));
}

// 录入群聊信息
function insertGroups(data) {
  return new Promise((resolve, reject) => {
    const { group_id } = data;

    const params = querystring.stringify({
      data: [group_id]
    });

    // 查询公会是否存在
    httpRequest.post(`${battle_url}/get_groups`, params)
      .then(res => {
        // return 不可省略，否则代码会继续执行
        if (res.length) return resolve();

        const { group_name } = data;
        const params = querystring.stringify({
          data: [group_id, group_name]
        });

        // 账号不存在则写入数据
        httpRequest.post(`${battle_url}/set_groups`, params)
          .then(() => {
            resolve();
            global.yumemi.logger.info(`INSERT group succrss: ${group_id}`);
          })
          .catch(err => {
            reject(err);
          })
      })
      .catch(err => {
        reject(err);
      })
  })
}

// 录入成员信息
function insertMember(data) {
  return new Promise((resolve, reject) => {
    const { group_id, user_id } = data;
    const params = querystring.stringify({
      data: [group_id, user_id]
    });

    // 查询成员是否存在
    httpRequest.post(`${battle_url}/get_member`, params)
      .then(res => {
        // return 不可省略，否则代码会继续执行
        if (res.length) return resolve();

        const { sender: { card } } = data;
        const params = querystring.stringify({
          data: [group_id, user_id, card]
        });

        // 账号不存在则写入数据
        httpRequest.post(`${battle_url}/set_member`, params)
          .then(() => {
            global.yumemi.logger.info(`INSERT member succrss: ${group_id} ${user_id}`);
            resolve();
          })
          .catch(err => {
            reject(err);
          })
      })
      .catch(err => {
        reject(err);
      })
  })
}

async function checkBattle(data) {
  // 待优化 这里应该单独写一个事务处理校验
  await insertUser(data);
  await insertGroups(data);
  await insertMember(data);
}

module.exports = { checkBattle }