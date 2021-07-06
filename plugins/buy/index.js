const { scheduleJob } = require('node-schedule');
const { readdirSync } = require('fs');

const all_job = new Set();
const utc8 = '0 0 0/6 * * ?';
const utc9 = '0 0 1,7,13,19 * * ?';
const buy_path = './data/images/buy';
const buy_images = readdirSync(buy_path);

function send(bot, all_group) {
  const img = buy_images[Math.floor(Math.random() * buy_images.length)];

  for (const group_id of all_group) {
    bot.sendGroupMsg(group_id, `[CQ:image,file=${buy_path}/${img}]`);
  }
}

function scheduleBuy(bot, cron, version) {
  return scheduleJob(cron, async () => {
    const { groups } = bot;
    const all_group = [];

    for (const group_id in groups) {
      if (!groups[group_id].plugins.includes('buy')) {
        break
      }
      groups[group_id].settings.buy.version === version && all_group.push(Number(group_id));
    }

    send(bot, all_group);
  });
}

function listener(bot) {
  all_job.add(scheduleBuy(bot, utc8, 'cn'));
  all_job.add(scheduleBuy(bot, utc9, 'jp'));
}

function activate(bot) {
  listener(bot);
}

function deactivate(bot) {
  all_job.forEach(job => job.cancel());
  all_job.clear();
}

module.exports = {
  activate, deactivate
}