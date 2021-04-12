tools.scheduleJob('0 0 0 * * ?', () => {
	const group = tools.getYAML('group');
	const { hitokoto: { url, param } } = tools.getYAML('api');

	for (let i = 0; i < 1; i++) {
		tools.getHttps(`${url}${param}`)
			.then(hitokoto => {
				// 判断开启服务的群
				for (const group_id in group) {
					if (!group[group_id].enable) continue;
					if (group[group_id].plugins.netdepress.enable) bot.sendGroupMsg(group_id, hitokoto);
				}
			})
			.catch(err => {
				if (err) bot.logger.error(`Error: ${err.message}`);
				else bot.logger.warn(`https 请求超时，正在重新发起请求`), i--;
			});
	}
});