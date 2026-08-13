import './style.css';
import { seasonNumberForDate, formatSeasonRange } from './seasons.js';
import { matchResult, winnerEmoji } from './scoring.js';
import { MATCHES } from './matches.js';
import { buildDistributionChart, attachChartTooltips } from './charts.js';

const S_COLOR = '#3987e5';
const R_COLOR = '#d95926';

const root = document.getElementById('app');

const state = {
  selectedSeason: 'all',
};

render();

function render() {
  const seasons = [...new Set(MATCHES.map((m) => seasonNumberForDate(m.date)))].sort((a, b) => a - b);

  const filtered =
    state.selectedSeason === 'all'
      ? MATCHES
      : MATCHES.filter((m) => seasonNumberForDate(m.date) === Number(state.selectedSeason));

  const stats = computeStats(filtered);

  root.innerHTML = `
    <header class="topbar">
      <h1>🦅 vs 🐊 個サル対戦記録</h1>
    </header>

    <section class="season-tabs">
      <button class="tab ${state.selectedSeason === 'all' ? 'active' : ''}" data-season="all">全期間</button>
      ${seasons
        .map(
          (s) =>
            `<button class="tab ${String(state.selectedSeason) === String(s) ? 'active' : ''}" data-season="${s}">
              Season ${s}
            </button>`,
        )
        .join('')}
    </section>

    ${state.selectedSeason !== 'all' ? `<p class="season-range">${formatSeasonRange(Number(state.selectedSeason))}</p>` : ''}

    <section class="stats-grid">
      <div class="stat-card">
        <h3>勝敗数</h3>
        <p>🦅 樋口(S): <strong>${stats.sWins}</strong>勝</p>
        <p>🐊 本郷(R): <strong>${stats.rWins}</strong>勝</p>
        <p>引き分け/無効: <strong>${stats.draws + stats.voided}</strong></p>
        <p class="season-winner">${stats.seasonWinnerLabel}</p>
      </div>
      <div class="stat-card">
        <h3>平均得点(1日あたり)</h3>
        <p>🦅 S: <strong>${stats.sAvgGoals}</strong></p>
        <p>🐊 R: <strong>${stats.rAvgGoals}</strong></p>
      </div>
      <div class="stat-card">
        <h3>平均アシスト(1日あたり)</h3>
        <p>🦅 S: <strong>${stats.sAvgAssists}</strong></p>
        <p>🐊 R: <strong>${stats.rAvgAssists}</strong></p>
      </div>
    </section>

    ${filtered.length > 0 ? renderDistributionSection(filtered) : ''}

    <section class="table-section">
      <table>
        <thead>
          <tr>
            <th>日付</th>
            <th>S得点-アシスト</th>
            <th>R得点-アシスト</th>
            <th>Sスコア</th>
            <th>Rスコア</th>
            <th>勝者</th>
            <th>メモ</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .slice()
            .reverse()
            .map((m) => renderRow(m))
            .join('')}
        </tbody>
      </table>
      ${filtered.length === 0 ? '<p class="empty">まだ記録がありません。</p>' : ''}
    </section>

    <footer class="footer-note">
      <p>新しい記録は <code>src/matches.js</code> を編集してpushすると反映されます。</p>
    </footer>
  `;

  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedSeason = btn.dataset.season;
      render();
    });
  });

  attachChartTooltips(root);
}

function renderDistributionSection(matches) {
  const goalsChart = buildDistributionChart({
    id: 'goalsChart',
    title: '得点の分布',
    unitLabel: '得点',
    sValues: matches.map((m) => m.sGoals),
    rValues: matches.map((m) => m.rGoals),
    sColor: S_COLOR,
    rColor: R_COLOR,
  });
  const assistsChart = buildDistributionChart({
    id: 'assistsChart',
    title: 'アシストの分布',
    unitLabel: 'アシスト',
    sValues: matches.map((m) => m.sAssists),
    rValues: matches.map((m) => m.rAssists),
    sColor: S_COLOR,
    rColor: R_COLOR,
  });

  return `
    <section class="dist-section">
      <div class="dist-header">
        <h3>個人統計分布</h3>
        <div class="chart-legend">
          <span class="legend-item"><span class="swatch" style="background:${S_COLOR}"></span>樋口(S)</span>
          <span class="legend-item"><span class="swatch" style="background:${R_COLOR}"></span>本郷(R)</span>
          <span class="legend-item"><span class="swatch swatch-dashed"></span>期待値(平均)</span>
        </div>
      </div>
      <div class="dist-grid">
        ${goalsChart}
        ${assistsChart}
      </div>
    </section>
  `;
}

function renderRow(m) {
  const { sScore, rScore, winner } = matchResult(m);
  return `
    <tr class="${m.voided ? 'voided-row' : ''}">
      <td>${m.date}</td>
      <td>${m.sGoals}-${m.sAssists}</td>
      <td>${m.rGoals}-${m.rAssists}</td>
      <td>${sScore.toFixed(1)}</td>
      <td>${rScore.toFixed(1)}</td>
      <td class="winner-cell">${winnerEmoji(winner)}</td>
      <td class="note-cell">${escapeHtml(m.note || '')}</td>
    </tr>
  `;
}

function computeStats(matches) {
  let sWins = 0;
  let rWins = 0;
  let draws = 0;
  let voided = 0;
  let sGoalsSum = 0;
  let sAssistsSum = 0;
  let rGoalsSum = 0;
  let rAssistsSum = 0;

  matches.forEach((m) => {
    const { winner } = matchResult(m);
    if (winner === 'S') sWins += 1;
    else if (winner === 'R') rWins += 1;
    else if (winner === 'draw') draws += 1;
    else voided += 1;
    sGoalsSum += m.sGoals;
    sAssistsSum += m.sAssists;
    rGoalsSum += m.rGoals;
    rAssistsSum += m.rAssists;
  });

  const n = matches.length || 1;
  const avg = (sum) => (sum / n).toFixed(2);

  let seasonWinnerLabel = '対戦なし';
  if (sWins > rWins) seasonWinnerLabel = '🦅 樋口さんの勝ち越し(奢られる側)';
  else if (rWins > sWins) seasonWinnerLabel = '🐊 本郷さんの勝ち越し(奢られる側)';
  else if (sWins === rWins && matches.length > 0) seasonWinnerLabel = '五分(現時点で同数)';

  return {
    sWins,
    rWins,
    draws,
    voided,
    sAvgGoals: avg(sGoalsSum),
    sAvgAssists: avg(sAssistsSum),
    rAvgGoals: avg(rGoalsSum),
    rAvgAssists: avg(rAssistsSum),
    seasonWinnerLabel,
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
