const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const sqlite = require(`${__yumemi}/utils/sqlite`);

const api = new Router();
const battle_sql = new Map([
  ['get_user', 'SELECT count(*) AS length FROM user WHERE id = ?'],
  ['set_user', 'INSERT INTO user (id, nickname) VALUES (?, ?)'],
  ['get_groups', 'SELECT count(*) AS length FROM groups WHERE id = ?'],
  ['set_groups', 'INSERT INTO groups (id, name) VALUES (?, ?)'],
  ['get_member', 'SELECT count(*) AS length FROM member WHERE group_id = ? AND user_id = ?'],
  ['set_member', 'INSERT INTO member (group_id, user_id, card) VALUES (?, ?, ?)'],
  ['get_now_battle', 'SELECT battle.id, battle.title, battle.syuume, battle.one, battle.two, battle.three, battle.four, battle.five, battle.crusade, count(beat.id) AS length, battle.update_time FROM battle LEFT JOIN beat ON battle.id = beat.battle_id AND beat.fight_time BETWEEN ? AND ? WHERE battle.group_id = ? AND battle.start_date BETWEEN ? AND ?'],
  ['set_battle', 'INSERT INTO battle (group_id, title, one, two, three, four, five, crusade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'],
  ['delete_battle', 'DELETE FROM battle WHERE group_id = ? AND start_date BETWEEN ? AND ?'],
  ['get_now_beat', 'SELECT number, boss, damage, fight_time FROM beat WHERE group_id = ? AND user_id = ? AND fight_time BETWEEN ? AND ? ORDER BY fight_time DESC'],
  ['set_beat', 'INSERT INTO beat (battle_id, group_id, user_id, number, syuume, boss, damage, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'],
  ['update_battle', 'UPDATE battle SET syuume = ?, one = ?, two = ?, three = ?, four = ?, five = ?, crusade = ?, update_time = ? WHERE group_id = ? AND start_date BETWEEN ? AND ?'],
  ['reservation', 'UPDATE battle SET crusade = ?, update_time = ? WHERE group_id = ? AND start_date BETWEEN ? AND ?'],
  ['update_beat', 'UPDATE beat SET damage = ? WHERE user_id = ? AND number = ? AND fight_time BETWEEN ? AND ?'],
]);

api.use(bodyParser());

api.post('/test', async ctx => {
  ctx.body = 'this is a test...'
  ctx.status = 200;
})

api.post('/battle/:action', async ctx => {
  const { params } = ctx.request.body;

  let action = null;
  switch (ctx.params.action) {
    case 'get_user':
    case 'get_groups':
    case 'get_member':
    case 'get_now_battle':
      action = 'get';
      break;
    case 'set_user':
    case 'set_groups':
    case 'set_member':
    case 'set_battle':
    case 'delete_battle':
    case 'set_beat':
    case 'update_battle':
    case 'reservation':
    case 'update_beat':
      action = 'run';
      break;
    case 'get_now_beat':
      action = 'all';
      break;
  }

  action && await sqlite[action](battle_sql.get(ctx.params.action), params)
    .then(data => {
      ctx.body = data;
      ctx.status = 200;
    })
    .catch(err => {
      console.log(err)
      ctx.body = err;
      ctx.status = 500;
    })
})

api.post('/send/:target', async ctx => {
  const { target } = ctx.params;

  if (target !== 'private' && target !== 'group') {
    ctx.status = 404;
    return;
  }

  const { user_id, group_id, msg } = ctx.request.body;

  if (user_id && group_id || !user_id && !group_id || !msg) {
    ctx.status = 400;
    return;
  }

  // 1分钟同一 ip 调用100次直接 ban 掉
  //...

  const { fl, gl } = bot;

  switch (target) {
    case 'private':
      fl.has(user_id) ?
        (
          ctx.status = 200,
          bot.sendPrivateMsg(user_id, msg)
        ) :
        ctx.status = 403
      break;
    case 'group':
      gl.has(group_id) ?
        (
          ctx.status = 200,
          bot.sendGroupMsg(group_id, msg)
        ) :
        ctx.status = 403
      break;
  }
})

module.exports = api;