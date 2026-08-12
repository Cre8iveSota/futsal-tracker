# futsal-tracker

樋口創太(S) 🦅 vs 本郷凌太郎(R) 🐊 の個サル対戦記録アプリ。

- 1日ごとに得点・アシストを入力
- スコア = 得点 × 1 + アシスト × 0.8 で自動計算し、その日の勝者を表示
- シーズン(4か月区切り)ごとに勝敗数・平均得点・平均アシストを集計
- データは Firebase Firestore に保存し、樋口さん・本郷さんそれぞれの端末から同期
- 閲覧は誰でも可能、記録の追加・編集・削除は Google サインインした本人のみ

## 公開URL

GitHub Pages を有効化すると `https://<GitHubユーザー名>.github.io/futsal-tracker/` で公開されます。

## セットアップ手順(初回のみ・あなた自身の作業)

### 1. GitHub Pages を有効化する

このリポジトリの Settings → Pages → Source を **GitHub Actions** に設定してください。
`main` ブランチに push すると `.github/workflows/deploy.yml` が自動でビルド・公開します。

### 2. Firebase プロジェクトを作成する(無料)

1. https://console.firebase.google.com/ で新しいプロジェクトを作成(Googleアカウントがあれば無料)
2. 「構築」→「Firestore Database」→ データベースを作成(本番環境モードでOK、リージョンは `asia-northeast1` など任意)
3. 「構築」→「Authentication」→ Sign-in method で **Google** プロバイダを有効化
4. Authentication → Settings → 承認済みドメイン に、GitHub Pages の公開ドメイン
   (`<GitHubユーザー名>.github.io`)を追加
5. プロジェクトの設定(⚙️アイコン)→ 全般 → 「マイアプリ」→ ウェブアプリを追加(`</>`アイコン)
6. 表示された `firebaseConfig` オブジェクト(`apiKey`, `authDomain`, `projectId` などを含むJSON)をコピー

### 3. Firestore のセキュリティルールを設定する

Firestore Database → ルール タブに、このリポジトリの `firestore.rules` の内容を貼り付けて公開してください。
`ALLOWED_EMAILS` 相当の箇所(`request.auth.token.email in [...]`)に、書き込みを許可する
Google アカウントのメールアドレス(あなたと本郷さんの分)を追加してください。

### 4. アプリに Firebase の設定を読み込ませる

1. 公開されたページ(`https://<GitHubユーザー名>.github.io/futsal-tracker/`)を開く
2. 初回は設定画面が表示されるので、手順2でコピーした `firebaseConfig` のJSONをそのまま貼り付けて「接続する」
3. 設定はブラウザの localStorage に保存されるので、以後その端末では再入力不要
4. 本郷さんの端末でも同じURLを開いて同じ設定を貼り付ければ、同じデータを共有できます
5. Googleでサインインすると入力フォームが表示され、記録の追加・編集・削除ができます

### 5. 過去データの読み込み

サインイン後、データが空の状態だと「過去データを読み込む」ボタンが表示されます。
LINEノート(2025-08〜2026-08)から読み取った記録があらかじめ `src/seedData.js` に入っているので、
ボタン一つでFirestoreに一括投入されます(既にデータがある場合は動作しません)。

読み取った過去データのうち、以下の2件は元メモの意味が読み取りきれなかったため
`note` 欄に注記を残してあります。アプリ上で内容を確認し、必要なら編集してください。

- 2025-10-25: 元メモに「慈悲4-5」という注記あり
- 2025-11-30: 元メモに🦅🤝🐊(握手)の記載あり。シーズン最終日の特別な意味づけの可能性

## シーズンの区切りについて

過去データを見る限り、実際のシーズン区切りは次の4か月サイクルの繰り返しでした(1年で3シーズン)。

- Season 1: 2025-08-01 〜 2025-11-30
- Season 2: 2025-12-01 〜 2026-03-31
- Season 3: 2026-04-01 〜 2026-07-31
- Season 4: 2026-08-01 〜(進行中)

「1年で4シーズン」というご説明とはズレがあるかもしれません。もし今後は3か月区切り(四半期)の
本来の4シーズン制に変更したい場合は、`src/seasons.js` の `SEASON_LENGTH_MONTHS` を `3` に、
エポック(Season 1 開始月)を実際の開始日に合わせて変更してください。

## 「同じチームのため無効」の扱い

その日たまたま同じチームだった場合の記録は `voided: true` として保存され、勝敗数にはカウントされませんが、
平均得点・平均アシストの集計には含まれます(実際にプレーした記録として)。挙動を変えたい場合は
`src/main.js` の `computeStats` を調整してください。

## ローカル開発

```sh
npm install
npm run dev
```

## 技術スタック

- Vite(ビルドツール)+ Vanilla JS
- Firebase Firestore(データ保存)+ Firebase Authentication(Googleサインイン)
- GitHub Actions → GitHub Pages(無料ホスティング)
