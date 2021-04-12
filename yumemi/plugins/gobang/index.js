class Gobang {
  static allBattle = new Map();
  static reg = { x: /[a-zA-Z]/g, y: /[0-9]/g };
  static delta = [[[0, 1], [0, -1]], [[-1, 0], [1, 0]], [[-1, -1], [1, 1]], [[1, -1], [-1, 1]],];
  static alphabet = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ';
  static numbers = ['　', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];

  constructor(group_id, user_id) {
    this.group_id = group_id;
    this.black = user_id;
    this.white = null;
    this.board = [];
    this.state = 'black';
    this.chessman = [];
    this.history = [];
  }

  start(boardSize = 8) {
    for (let i = 0, j = 0; i <= boardSize; j++) {
      if (j === 0) this.board[i] = [];

      switch (i) {
        case 0:
          this.board[i].push(j === 0 ? '┌' : (j === boardSize ? '┐' : '┬'));
          break;
        case boardSize:
          this.board[i].push(j === 0 ? '└' : (j === boardSize ? '┘' : '┴'));
          break;

        default:
          this.board[i].push(j === 0 ? '├' : (j === boardSize ? '┤' : '┼'));
          break;
      }

      if (j === boardSize) this.board[i].unshift(Gobang.alphabet[i]), i++, j = -1;
    }

    Gobang.numbers.length = boardSize + 2;
    this.board.unshift(Gobang.numbers);
    bot.sendGroupMsg(this.group_id, this.board.join('\n'))
  }

  rollback(user_id) {
    // 既不是黑棋手也不是白棋手则指指点点
    if (user_id !== this.white && user_id !== this.black) return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<`);
    const [x, y] = this.history[this.history.length - 1];
    this.board[x][y] = '┼';
    bot.sendGroupMsg(this.group_id, this.board.join('\n'));
  }

  move(user_id, x, y) {
    // 白棋未录入棋手则判断记录
    if (!this.white && this.black !== user_id) {
      this.white = user_id;
      bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 加入当前对局`);
    }

    // 既不是黑棋手也不是白棋手则指指点点
    if (user_id !== this.white && user_id !== this.black) return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<`);

    // 坐标越界
    if (!this.board[x][y]) return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 越界了，亲 (╯▔皿▔)╯`);

    // const pieces = new Set(['●', '○']);
    if (this.board[x][y] === '●' || this.board[x][y] === '○') return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 当前位置已经有棋子啦，换个位置下吧`);

    const state = user_id === this.black ? 'black' : 'white';
    if (this.state !== state) {
      return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 还没到你的回合呢，你急啥 (lll￢ω￢)`);
    }

    this.board[x][y] = state === 'black' ? '●' : '○';

    // 换手
    this.state = this.black === 'white' ? 'black' : 'white';

    // 历史记录
    this.history.push([x, y]);

    // 邻子数
    this.chessman.push([x, y]);

    // 落子后发送新的棋盘数据
    bot.sendGroupMsg(this.group_id, this.board.join('\n'));

    // 循环遍历五子棋数组规则
    for (const [last, next] of Gobang.delta) {
      let newX, newY = null;

      for (let i = 1, j = true; i < 5; i++) {
        // 初次循环 j = true 即落子后，则返回棋子左侧坐标
        newX = x + (j ? last[0] : next[0]) * i;
        newY = y + (j ? last[1] : next[1]) * i;

        // 邻处有相同棋子则继续遍历
        if (this.board[newX][newY] === this.board[x][y]) {
          this.chessman.push([newX, newY]);

          if (this.chessman.length < 5) continue;
          else {
            Gobang.allBattle.delete(this.group_id);
            bot.sendGroupMsg(this.group_id, `check mate！恭喜 [CQ:at,qq=${user_id}] 获得本轮胜利~ ヾ(≧▽≦*)o`);
            return;
          }
        } else {
          // 左侧没相同棋子则返回右侧坐标 j = false
          if (j) {
            j = !j, i = 0;
          } else {
            j = !j;
            this.chessman.length = 1;
            break;
          }
        }
      }
    }
  }
}

module.exports = ctx => {
  const { group_id, user_id, raw_message, serve } = ctx;

  switch (serve) {
    case 'start':
      if (Gobang.allBattle.has(group_id)) {
        bot.sendGroupMsg(group_id, '当前群聊对局尚未结束，请勿重复开启');
        return;
      }

      const gobang = new Gobang(group_id, user_id);

      Gobang.allBattle.set(group_id, gobang);
      gobang.start();
      break;

    case 'move':
      // allBoard 不存在该群消息提前 return
      if (!Gobang.allBattle.has(group_id)) {
        bot.sendGroupMsg(group_id, `当前群聊未开启对局`);
        return;
      }

      // 落子坐标
      const x = raw_message.match(Gobang.reg.x).join().toUpperCase().charCodeAt() - 64;
      const y = parseInt(raw_message.match(Gobang.reg.y).join());
      Gobang.allBattle.get(group_id).move(user_id, x, y);
      break;

    case 'rollback':
      // allBoard 不存在该群消息提前 return
      if (!Gobang.allBattle.has(group_id)) {
        bot.sendGroupMsg(group_id, `当前群聊未开启对局`);
        return;
      }

      Gobang.allBattle.get(group_id).rollback(user_id);
      break;

    case 'over':
      Gobang.allBattle.delete(group_id);
      bot.sendGroupMsg(group_id, `已中止当前对局`);
      break;
  }
}