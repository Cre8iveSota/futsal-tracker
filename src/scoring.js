// 得点1点 = 1点、アシスト1回 = 0.8点として1日の合計点を算出する。
export const ASSIST_WEIGHT = 0.8;

export function computeDayScore(goals, assists) {
  return goals + assists * ASSIST_WEIGHT;
}

// 引き分け(同スコア)や「同じチームのため無効」の日は勝敗にカウントしない。
export function matchResult(match) {
  const sScore = computeDayScore(match.sGoals, match.sAssists);
  const rScore = computeDayScore(match.rGoals, match.rAssists);
  let winner;
  if (match.voided) winner = 'void';
  else if (sScore > rScore) winner = 'S';
  else if (rScore > sScore) winner = 'R';
  else winner = 'draw';
  return { sScore, rScore, winner };
}

export function winnerEmoji(winner) {
  if (winner === 'S') return '🦅';
  if (winner === 'R') return '🐊';
  if (winner === 'draw') return '🤝';
  return '—';
}
