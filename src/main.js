import './style.css';
import {
  getStoredConfig,
  storeConfig,
  clearConfig,
  initFirebase,
  watchMatches,
  addMatch,
  updateMatch,
  deleteMatch,
  seedIfEmpty,
  watchAuth,
  signIn,
  signOutUser,
} from './firebaseClient.js';
import { seasonNumberForDate, formatSeasonRange } from './seasons.js';
import { matchResult, winnerEmoji } from './scoring.js';
import { SEED_MATCHES } from './seedData.js';

const root = document.getElementById('app');

const state = {
  user: null,
  matches: [],
  selectedSeason: 'all',
  editingId: null,
};

// ---- 起動シーケンス ----------------------------------------------------

const storedConfig = getStoredConfig();
if (storedConfig) {
  startApp(storedConfig);
} else {
  renderConfigScreen();
}

function renderConfigScreen(errorMessage) {
  root.innerHTML = `
    <div class="config-screen">
      <h1>🦅 vs 🐊 個サル対戦記録</h1>
      <p>初回セットアップです。Firebase プロジェクトの設定(JSON)を貼り付けてください。<br>
      手順は README.md を参照してください(Firebase コンソール → プロジェクトの設定 → 全般 → マイアプリ → SDK の設定と構成 → 「構成」)。</p>
      ${errorMessage ? `<p class="error">${errorMessage}</p>` : ''}
      <textarea id="configInput" rows="10" placeholder='{"apiKey": "...", "authDomain": "...", "projectId": "...", ...}'></textarea>
      <button id="configSubmit">接続する</button>
    </div>
  `;
  document.getElementById('configSubmit').addEventListener('click', () => {
    const raw = document.getElementById('configInput').value.trim();
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('apiKey / projectId が見つかりません');
      }
      storeConfig(parsed);
      startApp(parsed);
    } catch (e) {
      renderConfigScreen(`設定の読み込みに失敗しました: ${e.message}`);
    }
  });
}

function startApp(config) {
  try {
    initFirebase(config);
  } catch (e) {
    clearConfig();
    renderConfigScreen(`Firebase の初期化に失敗しました: ${e.message}`);
    return;
  }

  watchAuth((user) => {
    state.user = user;
    render();
  });

  watchMatches(
    (matches) => {
      state.matches = matches;
      render();
    },
    (err) => {
      root.innerHTML = `<div class="config-screen">
        <h1>読み込みエラー</h1>
        <p class="error">${err.message}</p>
        <p>Firestore のセキュリティルールや設定を確認してください。</p>
        <button id="resetConfig">設定をやり直す</button>
      </div>`;
      document.getElementById('resetConfig').addEventListener('click', () => {
        clearConfig();
        renderConfigScreen();
      });
    },
  );

  render();
}

// ---- 描画 ----------------------------------------------------------------

function render() {
  if (!state.matches) return;

  const seasons = [...new Set(state.matches.map((m) => seasonNumberForDate(m.date)))].sort((a, b) => a - b);
  const isSignedIn = !!state.user;

  const filtered =
    state.selectedSeason === 'all'
      ? state.matches
      : state.matches.filter((m) => seasonNumberForDate(m.date) === Number(state.selectedSeason));

  const stats = computeStats(filtered);

  root.innerHTML = `
    <header class="topbar">
      <h1>🦅 vs 🐊 個サル対戦記録</h1>
      <div class="auth-area">
        ${
          isSignedIn
            ? `<span class="user-email">${escapeHtml(state.user.email || state.user.displayName || 'サインイン中')}</span>
               <button id="signOutBtn" class="ghost">サインアウト</button>`
            : `<button id="signInBtn">Googleでサインイン(入力するには必要)</button>`
        }
      </div>
    </header>

    ${isSignedIn && state.matches.length === 0 ? `<div class="banner">
      <p>データがまだありません。過去のLINEノートから読み取った記録を一括投入できます。</p>
      <button id="seedBtn">過去データを読み込む(${SEED_MATCHES.length}件)</button>
    </div>` : ''}

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

    ${isSignedIn ? renderForm() : ''}

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
            ${isSignedIn ? '<th></th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${filtered
            .slice()
            .reverse()
            .map((m) => renderRow(m, isSignedIn))
            .join('')}
        </tbody>
      </table>
      ${filtered.length === 0 ? '<p class="empty">まだ記録がありません。</p>' : ''}
    </section>
  `;

  attachHandlers(isSignedIn);
}

function renderForm() {
  const editing = state.editingId ? state.matches.find((m) => m.id === state.editingId) : null;
  const v = editing || { date: todayStr(), sGoals: '', sAssists: '', rGoals: '', rAssists: '', voided: false, note: '' };
  return `
    <section class="match-form">
      <h3>${editing ? '記録を編集' : '今日の記録を追加'}</h3>
      <div class="form-grid">
        <label>日付<input type="date" id="f-date" value="${v.date}"></label>
        <label>S得点<input type="number" id="f-sGoals" min="0" value="${v.sGoals}"></label>
        <label>Sアシスト<input type="number" id="f-sAssists" min="0" value="${v.sAssists}"></label>
        <label>R得点<input type="number" id="f-rGoals" min="0" value="${v.rGoals}"></label>
        <label>Rアシスト<input type="number" id="f-rAssists" min="0" value="${v.rAssists}"></label>
        <label class="checkbox"><input type="checkbox" id="f-voided" ${v.voided ? 'checked' : ''}> 同じチームのため無効</label>
        <label class="note-field">メモ<input type="text" id="f-note" value="${escapeHtml(v.note || '')}"></label>
      </div>
      <div class="form-actions">
        <button id="f-submit">${editing ? '更新する' : '追加する'}</button>
        ${editing ? '<button id="f-cancel" class="ghost">キャンセル</button>' : ''}
      </div>
    </section>
  `;
}

function renderRow(m, isSignedIn) {
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
      ${
        isSignedIn
          ? `<td class="row-actions">
              <button class="icon-btn" data-edit="${m.id}" title="編集">✎</button>
              <button class="icon-btn" data-delete="${m.id}" title="削除">🗑</button>
            </td>`
          : ''
      }
    </tr>
  `;
}

// ---- 集計 ------------------------------------------------------------

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

// ---- イベント ----------------------------------------------------------

function attachHandlers(isSignedIn) {
  document.getElementById('signInBtn')?.addEventListener('click', async () => {
    try {
      await signIn();
    } catch (e) {
      alert(`サインインに失敗しました: ${e.message}`);
    }
  });

  document.getElementById('signOutBtn')?.addEventListener('click', () => signOutUser());

  document.getElementById('seedBtn')?.addEventListener('click', async (e) => {
    e.target.disabled = true;
    e.target.textContent = '読み込み中...';
    try {
      await seedIfEmpty(SEED_MATCHES);
    } catch (err) {
      alert(`読み込みに失敗しました: ${err.message}`);
      e.target.disabled = false;
      e.target.textContent = `過去データを読み込む(${SEED_MATCHES.length}件)`;
    }
  });

  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedSeason = btn.dataset.season;
      render();
    });
  });

  if (isSignedIn) {
    document.getElementById('f-submit')?.addEventListener('click', onSubmitForm);
    document.getElementById('f-cancel')?.addEventListener('click', () => {
      state.editingId = null;
      render();
    });
    document.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.editingId = btn.dataset.edit;
        render();
        document.querySelector('.match-form')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
    document.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('この記録を削除しますか？')) return;
        await deleteMatch(btn.dataset.delete);
      });
    });
  }
}

async function onSubmitForm() {
  const payload = {
    date: document.getElementById('f-date').value,
    sGoals: Number(document.getElementById('f-sGoals').value) || 0,
    sAssists: Number(document.getElementById('f-sAssists').value) || 0,
    rGoals: Number(document.getElementById('f-rGoals').value) || 0,
    rAssists: Number(document.getElementById('f-rAssists').value) || 0,
    voided: document.getElementById('f-voided').checked,
    note: document.getElementById('f-note').value.trim(),
  };
  if (!payload.date) {
    alert('日付を入力してください');
    return;
  }
  try {
    if (state.editingId) {
      await updateMatch(state.editingId, payload);
      state.editingId = null;
    } else {
      await addMatch(payload);
    }
  } catch (e) {
    alert(`保存に失敗しました: ${e.message}`);
  }
}

// ---- ユーティリティ ------------------------------------------------------

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
