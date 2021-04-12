const word = new Map();

// 12小时清空一次
tools.scheduleJob('0 0 0/12 * * ?', () => word.forEach(values => values.clear()));

module.exports = ctx => {
	const { group_id, raw_message } = ctx;
	const chat = tools.getYAML('chat');

	if (!word.has(group_id)) word.set(group_id, new Set());

	// 匹配正则调用模块
	for (const regular in chat) {
		const reg = new RegExp(regular);

		if (!reg.test(raw_message)) continue;
		else {
			const msg = chat[regular][Math.floor(Math.random() * chat[regular].length)];

			if (word.get(group_id).has(msg)) return;

			bot.sendGroupMsg(group_id, msg);
			word.get(group_id).add(msg);
			return;
		}
	}
}