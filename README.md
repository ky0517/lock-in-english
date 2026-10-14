# LOCK IN ENGLISH — 1000 WORDS

既存700語をそのまま残し、重複しない300語を追加したバージョン。新規300語には日本語訳・米語寄りのIPA・英語例文を収録。

## GitHubへの更新

1. アプリの「設定」から進捗をJSONでバックアップ。
2. このZIPを解凍し、GitHubリポジトリのルートに同じ階層構造でアップロード。特に `data/words.json` は `data` フォルダ内に置く。
3. `index.html` と `app.js` も更新する（1000語の件数検査とキャッシュ回避のため）。
4. Commit changes後、GitHub Pagesが反映されてからアプリを再読み込み。総単語数が1000と表示されることを確認。

学習記録のlocalStorageキーは従来と同じ。iPhoneとPCの進捗は同期しません。

発音記号はCMU Pronouncing Dictionaryの米語発音をIPAに変換した近似表記であり、厳密な音節境界・二次強勢などの校訂はしていません。
