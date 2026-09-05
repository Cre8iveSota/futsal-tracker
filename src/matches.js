// 対戦記録データ本体。このアプリはこの配列がそのまま唯一のデータソースです。
// 新しい試合を追加するときは、末尾に1行追加してこのファイルをコミット・pushしてください
// (pushすればGitHub Actionsが自動でビルド・再公開します)。
//
// S = 樋口創太、R = 本郷凌太郎。各行は「得点-アシスト」。
// voided: true の行は「同じチームのため無効」として勝敗にはカウントしない。
// note があるものは元LINEノートの注記をそのまま残してあるので、意味が分かる場合は
// 書き換えてください。
//
// 2025-08〜2026-08分はLINEノートのスクリーンショットから読み取って収録済み。
export const MATCHES = [
  // Season 1 (2025-08-01 〜 2025-11-30)
  { date: '2025-08-03', sGoals: 5, sAssists: 2, rGoals: 3, rAssists: 2, voided: false, note: '' },
  { date: '2025-08-09', sGoals: 2, sAssists: 1, rGoals: 1, rAssists: 3, voided: false, note: '' },
  { date: '2025-08-23', sGoals: 3, sAssists: 3, rGoals: 4, rAssists: 3, voided: false, note: '' },
  { date: '2025-08-30', sGoals: 1, sAssists: 2, rGoals: 2, rAssists: 2, voided: true, note: '同じチームのため無効' },
  { date: '2025-09-14', sGoals: 1, sAssists: 2, rGoals: 5, rAssists: 2, voided: false, note: '' },
  { date: '2025-09-23', sGoals: 3, sAssists: 2, rGoals: 5, rAssists: 4, voided: false, note: '' },
  { date: '2025-09-27', sGoals: 7, sAssists: 2, rGoals: 6, rAssists: 2, voided: false, note: '' },
  { date: '2025-10-11', sGoals: 4, sAssists: 0, rGoals: 4, rAssists: 2, voided: false, note: '' },
  { date: '2025-10-18', sGoals: 6, sAssists: 3, rGoals: 5, rAssists: 0, voided: false, note: '' },
  { date: '2025-10-25', sGoals: 4, sAssists: 3, rGoals: 4, rAssists: 2, voided: false, note: '元メモに「慈悲4-5」の注記あり。意味不明のため要確認' },
  { date: '2025-11-15', sGoals: 1, sAssists: 3, rGoals: 5, rAssists: 0, voided: false, note: '' },
  { date: '2025-11-20', sGoals: 2, sAssists: 2, rGoals: 1, rAssists: 1, voided: false, note: '' },
  { date: '2025-11-29', sGoals: 2, sAssists: 2, rGoals: 3, rAssists: 1, voided: false, note: '' },
  { date: '2025-11-30', sGoals: 2, sAssists: 1, rGoals: 2, rAssists: 3, voided: false, note: '元メモに🦅🤝🐊(握手)の記載あり。シーズン最終日の特別な意味づけかもしれないため要確認' },

  // Season 2 (2025-12-01 〜 2026-03-31)
  { date: '2025-12-07', sGoals: 3, sAssists: 1, rGoals: 6, rAssists: 3, voided: false, note: '' },
  { date: '2025-12-14', sGoals: 0, sAssists: 2, rGoals: 3, rAssists: 3, voided: false, note: '' },
  { date: '2025-12-20', sGoals: 4, sAssists: 3, rGoals: 4, rAssists: 2, voided: false, note: '' },
  { date: '2026-01-11', sGoals: 1, sAssists: 1, rGoals: 1, rAssists: 2, voided: false, note: '' },
  { date: '2026-01-18', sGoals: 1, sAssists: 2, rGoals: 2, rAssists: 1, voided: false, note: '' },
  { date: '2026-01-24', sGoals: 5, sAssists: 2, rGoals: 3, rAssists: 4, voided: false, note: '' },
  { date: '2026-02-01', sGoals: 4, sAssists: 1, rGoals: 1, rAssists: 3, voided: false, note: '' },
  { date: '2026-02-08', sGoals: 4, sAssists: 1, rGoals: 3, rAssists: 3, voided: false, note: '' },
  { date: '2026-02-21', sGoals: 2, sAssists: 0, rGoals: 1, rAssists: 0, voided: false, note: '' },
  { date: '2026-02-22', sGoals: 2, sAssists: 1, rGoals: 2, rAssists: 2, voided: false, note: '' },
  { date: '2026-03-01', sGoals: 2, sAssists: 0, rGoals: 3, rAssists: 2, voided: false, note: '' },
  { date: '2026-03-08', sGoals: 2, sAssists: 2, rGoals: 4, rAssists: 3, voided: false, note: '' },

  // Season 3 (2026-04-01 〜 2026-07-31)
  { date: '2026-04-05', sGoals: 5, sAssists: 1, rGoals: 3, rAssists: 2, voided: false, note: '' },
  { date: '2026-04-12', sGoals: 0, sAssists: 1, rGoals: 1, rAssists: 2, voided: false, note: '' },
  { date: '2026-04-19', sGoals: 5, sAssists: 1, rGoals: 5, rAssists: 3, voided: true, note: '同じチームのため無効' },
  { date: '2026-04-29', sGoals: 6, sAssists: 2, rGoals: 3, rAssists: 0, voided: false, note: '' },
  { date: '2026-05-06', sGoals: 7, sAssists: 5, rGoals: 3, rAssists: 1, voided: false, note: '' },
  { date: '2026-05-10', sGoals: 3, sAssists: 0, rGoals: 2, rAssists: 2, voided: false, note: '' },
  { date: '2026-05-17', sGoals: 3, sAssists: 1, rGoals: 3, rAssists: 2, voided: false, note: 'Deepな話あり' },
  { date: '2026-05-31', sGoals: 2, sAssists: 1, rGoals: 5, rAssists: 2, voided: false, note: '' },
  { date: '2026-06-07', sGoals: 2, sAssists: 6, rGoals: 3, rAssists: 2, voided: false, note: '' },
  { date: '2026-06-28', sGoals: 3, sAssists: 1, rGoals: 4, rAssists: 3, voided: false, note: '' },
  { date: '2026-07-04', sGoals: 0, sAssists: 2, rGoals: 4, rAssists: 3, voided: false, note: '' },
  { date: '2026-07-05', sGoals: 4, sAssists: 1, rGoals: 3, rAssists: 3, voided: false, note: '' },
  { date: '2026-07-12', sGoals: 2, sAssists: 2, rGoals: 2, rAssists: 1, voided: false, note: '' },
  { date: '2026-07-20', sGoals: 3, sAssists: 1, rGoals: 4, rAssists: 0, voided: false, note: '' },

  // Season 4 (2026-08-01 〜、進行中)
  { date: '2026-08-01', sGoals: 4, sAssists: 2, rGoals: 6, rAssists: 4, voided: false, note: '' },
  { date: '2026-08-11', sGoals: 5, sAssists: 2, rGoals: 2, rAssists: 4, voided: false, note: '' },
  { date: '2026-08-15', sGoals: 1, sAssists: 3, rGoals: 3, rAssists: 2, voided: true, note: '2チームのみのためノーゲーム' },
  { date: '2026-08-23', sGoals: 5, sAssists: 0, rGoals: 6, rAssists: 0, voided: false, note: '' },
  { date: '2026-08-29', sGoals: 2, sAssists: 4, rGoals: 2, rAssists: 2, voided: false, note: '' },
  { date: '2026-09-05', sGoals: 2, sAssists: 1, rGoals: 2, rAssists: 3, voided: false, note: '' },
];
