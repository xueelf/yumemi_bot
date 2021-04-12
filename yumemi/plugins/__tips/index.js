const word = new Map();
const chat = tools.getYAML('chat');
const { info: { index, docs, version } } = tools.getYAML('bot');

// 12小时清空一次
tools.scheduleJob('0 0 0/12 * * ?', () => word.forEach(values => values.clear()));

module.exports = ctx => {
	const { group_id, raw_message, serve } = ctx;

	const chat = () => {
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

	const ver = () => bot.sendGroupMsg(group_id, version);
	const help = () => bot.sendGroupMsg(group_id, `使用手册请访问：${docs}`);
	const login = () => bot.sendGroupMsg(group_id, `登录请访问：${index}\n该模块刚时装，功能较少，bug较多，仅供测试`);

	const list = () => {
		const { [group_id]: { plugins } } = tools.getYAML('group');
		const pluginList = new Set(['当前群服务列表：']);

		for (const plugin in plugins) pluginList.add(plugins[plugin].enable ? `|○|  ${plugin}` : `|△|  ${plugin}`);

		pluginList.add('如要查看更多设置可输入 settings');
		bot.sendGroupMsg(group_id, [...pluginList].join('\n'));
	}

	const settings = () => {
		const { [group_id]: { plugins } } = tools.getYAML('group');
		bot.sendGroupMsg(group_id, `当前群服务设置：\n${JSON.stringify(plugins, null, 2)}\n请不要随意修改参数，除非你知道自己在做什么`);
	}

	const rank = () => {
		const images = [];
		let version = raw_message.slice(0, 1);

		switch (version) {
			case 'b':
			case '国':
				version = 'bl';
				break;
			case 't':
			case '台':
				version = 'tw';
				break;
			case 'j':
			case '日':
				version = 'jp';
				break;
		}

		for (let i = 1; i <= 3; i++) images.push(`[CQ:image,file=${__yumemi}/data/images/rank/${version}rank_${i}.png]`);
		bot.sendGroupMsg(group_id, `※ 表格仅供参考，升r有风险，强化需谨慎\n${images.join('\n')}`);
	}


	eval(`${serve}()`);
}