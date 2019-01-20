# グラブル麻痺タイマー

二王の諍い

## フロント

フロント部分は `src` ディレクトリに入ってます。

`src/config.example.js` の名前を変更して `src/config.js` にしてください。

中にサーバのURLが書いてあるので適宜いじってください。
一人で使うだけの場合はサーバは不要です。

## サーバ

ルーム共有機能のためのWebSocketサーバ部分は `server` ディレクトリに入っています。

`npm install` したあとに `node index.js` で起動します。

`server/config.js` に設定が書いてあるので、自由にいじってください。

## ライセンス

MIT License