// トップに表示する「直近のコンディション」ホームセクション。
// シーズンタブの絞り込みとは独立して、常に全試合データの中から直近5試合を見る。
import { matchResult, winnerEmoji } from './scoring.js';
import { buildTrendLineChart } from './charts.js';

const RECENT_COUNT = 5;
const FLAT_THRESHOLD = 0.05; // これ未満の差は「横ばい」扱い

function sortByDateAsc(matches) {
  return [...matches].sort((a, b) => a.date.localeCompare(b.date));
}

export function getRecentMatches(matches, n = RECENT_COUNT) {
  return sortByDateAsc(matches).slice(-n);
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function shortDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

// 直近の連勝・連敗。最新の試合から遡って同じ勝者が続く回数を数え、
// 引き分け/無効試合に当たった時点、または勝者が変わった時点で止める。
export function computeStreak(matches) {
  const sorted = sortByDateAsc(matches);
  let streakWinner = null;
  let count = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const { winner } = matchResult(sorted[i]);
    if (winner !== 'S' && winner !== 'R') break;
    if (streakWinner === null) {
      streakWinner = winner;
      count = 1;
    } else if (winner === streakWinner) {
      count += 1;
    } else {
      break;
    }
  }
  return { winner: streakWinner, count };
}

function trendMarker(recentAvg, overallAvg) {
  const diff = recentAvg - overallAvg;
  if (Math.abs(diff) < FLAT_THRESHOLD) {
    return { icon: '→', cls: 'trend-flat', label: '±0.00' };
  }
  if (diff > 0) {
    return { icon: '▲', cls: 'trend-up', label: `+${diff.toFixed(2)}` };
  }
  return { icon: '▼', cls: 'trend-down', label: diff.toFixed(2) };
}

function trendRow(emoji, name, unit, recentValues, overallValues) {
  const recentAvg = average(recentValues);
  const overallAvg = average(overallValues);
  const marker = trendMarker(recentAvg, overallAvg);
  return `
    <li>
      <span>${emoji} ${name} ${unit}</span>
      <strong>${recentAvg.toFixed(2)}</strong>
      <span class="${marker.cls}">${marker.icon} ${marker.label}</span>
    </li>
  `;
}

export function renderHomeSection(allMatches, { sColor, rColor, sBorderColor, rBorderColor }) {
  if (allMatches.length === 0) return '';

  const recent = getRecentMatches(allMatches);
  const recentNonVoid = recent.filter((m) => !m.voided);

  let sWins = 0;
  let rWins = 0;
  let other = 0;
  recentNonVoid.forEach((m) => {
    const { winner } = matchResult(m);
    if (winner === 'S') sWins += 1;
    else if (winner === 'R') rWins += 1;
    else other += 1;
  });

  const streak = computeStreak(allMatches);

  const recentSGoals = recent.map((m) => m.sGoals);
  const recentRGoals = recent.map((m) => m.rGoals);
  const recentSAssists = recent.map((m) => m.sAssists);
  const recentRAssists = recent.map((m) => m.rAssists);
  const recentSScores = recent.map((m) => matchResult(m).sScore);
  const recentRScores = recent.map((m) => matchResult(m).rScore);

  const overallSGoals = allMatches.map((m) => m.sGoals);
  const overallRGoals = allMatches.map((m) => m.rGoals);
  const overallSAssists = allMatches.map((m) => m.sAssists);
  const overallRAssists = allMatches.map((m) => m.rAssists);
  const overallSScores = allMatches.map((m) => matchResult(m).sScore);
  const overallRScores = allMatches.map((m) => matchResult(m).rScore);

  let streakText = '直近は連勝・連敗なし';
  if (streak.winner && streak.count >= 2) {
    const name = streak.winner === 'S' ? '🦅 樋口さん' : '🐊 本郷さん';
    streakText = `${name}が${streak.count}連勝中`;
  } else if (streak.winner && streak.count === 1) {
    const name = streak.winner === 'S' ? '🦅 樋口さん' : '🐊 本郷さん';
    streakText = `直前の試合は${name}の勝ち`;
  }

  const sparkline = buildTrendLineChart({
    id: 'recentSparkline',
    title: '直近5試合のポイント推移',
    categories: recent.map((m) => shortDate(m.date)),
    sValues: recentSScores,
    rValues: recentRScores,
    sColor,
    rColor,
    unitLabel: '点',
  });

  const rows = recent
    .slice()
    .reverse()
    .map((m) => {
      const { sScore, rScore, winner } = matchResult(m);
      return `
      <tr class="${m.voided ? 'voided-row' : ''}">
        <td>${shortDate(m.date)}</td>
        <td><span class="stat-cell"><span class="stat-main">${m.sGoals}-${m.sAssists}</span><span class="stat-sub">${sScore.toFixed(1)}pt</span></span></td>
        <td><span class="stat-cell"><span class="stat-main">${m.rGoals}-${m.rAssists}</span><span class="stat-sub">${rScore.toFixed(1)}pt</span></span></td>
        <td class="winner-cell">${winnerEmoji(winner)}</td>
      </tr>
    `;
    })
    .join('');

  return `
    <section class="home-section">
      <div class="dist-header">
        <h2>直近のコンディション(直近${recent.length}試合)</h2>
        <div class="chart-legend">
          <span class="legend-item"><span class="swatch" style="background:${sColor}; border-color:${sBorderColor || 'transparent'}"></span>樋口(S)</span>
          <span class="legend-item"><span class="swatch" style="background:${rColor}; border-color:${rBorderColor || 'transparent'}"></span>本郷(R)</span>
        </div>
      </div>

      <div class="home-grid">
        <div class="home-card">
          <h3>直近${recent.length}試合の結果</h3>
          <table class="recent-table">
            <thead><tr><th>日付</th><th>S 得点-アシスト</th><th>R 得点-アシスト</th><th>勝者</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="home-note">成績: 🦅 S ${sWins}勝 ・ 🐊 R ${rWins}勝${other > 0 ? ` ・引分/無効 ${other}` : ''}</p>
        </div>

        <div class="home-card">
          <h3>連勝・連敗</h3>
          <p class="streak-highlight">${streakText}</p>

          <h3 class="home-subhead">好調・不調(直近${recent.length}試合 vs 全期間平均)</h3>
          <ul class="trend-list">
            ${trendRow('🦅', 'S', '得点', recentSGoals, overallSGoals)}
            ${trendRow('🐊', 'R', '得点', recentRGoals, overallRGoals)}
            ${trendRow('🦅', 'S', 'アシスト', recentSAssists, overallSAssists)}
            ${trendRow('🐊', 'R', 'アシスト', recentRAssists, overallRAssists)}
            ${trendRow('🦅', 'S', 'ポイント', recentSScores, overallSScores)}
            ${trendRow('🐊', 'R', 'ポイント', recentRScores, overallRScores)}
          </ul>
          <p class="home-note">▲ = 全期間平均より上振れ(好調) / ▼ = 下振れ(不調)</p>
        </div>
      </div>

      <div class="dist-grid dist-grid-single">
        ${sparkline}
      </div>
    </section>
  `;
}
