import { Client } from 'oicq';
import { readdirSync } from 'fs';
import { Job, scheduleJob } from 'node-schedule';

const all_job: Set<Job> = new Set();
const utc8: string = '0 0 0/6 * * ?';
const utc9: string = '0 0 1,7,13,19 * * ?';
const buy_path: string = './data/images/buy/';
const buy_images: string[] = readdirSync('./data/images/buy');

function send(bot: Client, all_group: number[]) {
  const img = buy_images[Math.floor(Math.random() * buy_images.length)];

  for (const group_id of all_group) {
    bot.sendGroupMsg(group_id, `[CQ:image,file=${buy_path}${img}]`);
  }
}

function scheduleBuy(bot: Client, cron: string, version: 'cn' | 'jp'): Job {
  const { groups } = bot;

  return scheduleJob(cron, async () => {
    const all_group: number[] = [];

    for (const group_id in groups) {
      if (!groups[group_id].plugins.includes('buy')) {
        break
      }
      groups[group_id].settings.buy.version === version && all_group.push(Number(group_id));
    }

    send(bot, all_group);
  });
}

function buy(bot: Client) {
  all_job.add(scheduleBuy(bot, utc8, 'cn'));
  all_job.add(scheduleBuy(bot, utc9, 'jp'));
}

function activate(bot: Client): void {
  buy(bot);
}

function deactivate(bot: Client): void {
  all_job.forEach((val) => val.cancel());
  all_job.clear();
}

export {
  activate, deactivate
}