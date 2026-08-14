// シーズンの打ち上げ記録。シーズンが終わったあと、実際に食べに行ったお店の記録。
// date が null の場合は「調整中(まだ行っていない)」として扱う。
export const SEASON_REWARDS = [
  {
    season: 1,
    date: '2026-02-07',
    item: 'すき焼き',
    mapUrl: 'https://maps.app.goo.gl/oh5tNgyNEioMmP1FA?g_st=il',
  },
  {
    season: 2,
    date: '2026-04-30',
    item: 'ステーキのコース',
    mapUrl: 'https://maps.app.goo.gl/8CCA6izxbbgyrpry8?g_st=il',
  },
  {
    season: 3,
    date: null,
    item: '調整中',
    mapUrl: null,
  },
];
