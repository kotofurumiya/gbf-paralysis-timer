const WebSocketServer = require('websocket').server;
const http = require('http');
const Hashids = require('hashids');

const hashidSalt = 'gbf-paralysis-timer';
const hashidMinLength = 5;
const hashidAlphabets = '0123456789abcdef'; // 16文字以上必要
const hashids = new Hashids(hashidSalt, hashidMinLength, hashidAlphabets);

const { HostedRoom } = require('./lib/hosted_room');
const config = require('./config');

// 共有ルームのマップ
const roomMap = {};
const connectionToRoomInfo = new Map();
const hostKeySaltNumber = 5542975;

// コネクションID
let nextConnectionId = 0;

function generateUniqueRoomId(conId) {
  const maxRetry = 10;

  for(let count = 0; count < maxRetry; count++) {
    const generated = hashids.encode(new Date().getTime(), conId, count);
    if(!(generated in roomMap)) {
      return generated;
    }
  }

  throw new Error('Room ID Conflict.');
}

// HTTPサーバを起動する
const server = http.createServer((request, response) => {
  response.writeHead(404);
  response.end();
});

server.on('error', (e) => {
  console.error('Error! Cannot start a server');
  console.error(e);
  process.exit(1);
});

server.listen(config.port, () => {
  console.log(`Server is listening on port ${config.port}`);
});

// WebSocketサーバを立てる
const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});

// オリジンをチェックする関数
function allowsOrigin(origin) {
  return config.acceptsAnyConnection || (config.accepts || []).includes(origin);
}

// クライアントからの接続要求時の処理
wsServer.on('request', (request) => {
  // 指定したオリジンからの通信以外は弾く
  if(!allowsOrigin(request.origin)) {
    request.reject();
    console.warn(`Connection from ${request.origin} rejected`);
    return;
  }

  // 指定したオリジンからの通信なら受け入れる
  const connection = request.accept('', request.origin);

  // コネクションIDの作成
  // 厳密なセッションに使うわけではないので作りは雑でいい
  // 10000超えたら0に戻る
  if(nextConnectionId > 10000) {
    nextConnectionId = 0;
  }

  const connectionId = nextConnectionId++;

  // クライアントからメッセージが来たときの処理
  connection.on('message', (message) => {
    // バイナリはサポート外
    if(message.type === 'binary') {
      connection.sendUTF(JSON.stringify({
        status: 'error',
        payload: {
          message: 'Binary message is not supported'
        }
      }));
      return;
    }

    // メッセージのJSONをパースしてエラーなら終わり
    let receivedJson = {};

    try {
      receivedJson = JSON.parse(message.utf8Data);
    } catch(e) {
      connection.sendUTF(JSON.stringify({
        status: 'error',
        payload: {
          message: 'Invalid JSON received'
        }
      }));

      console.error('JSON parse error', e);
      return;
    }

    // メッセージからpayloadとcommandを取り出す
    const payload = receivedJson.payload || {};
    const command = payload.command || 'none';

    // 送られてきたコマンドによって処理を振り分け
    if(command === 'createroom') {
      // createroomコマンドが来たら部屋を作成する

      // コネクションがすでにルーム作成済みなら既存のルームを返す
      if(connectionToRoomInfo.has(connection)) {
        const roomInfo = connectionToRoomInfo.get(connection);

        connection.sendUTF(JSON.stringify({
          status: 'ok',
          payload: {
            type: 'roomcreated',
            roomid: roomInfo.roomid,
            hostKey: roomInfo.hostKey
          }
        }));
        return;
      }

      // ルームが作成されていなければ作成する
      const roomid = generateUniqueRoomId(connectionId);
      const hostKey = hashids.encode(new Date().getTime(), connectionId, hostKeySaltNumber);
      const room = new HostedRoom(connection, hostKey);
      roomMap[roomid] = room;
      connectionToRoomInfo.set(connection, { roomid, hostKey });

      room.on('dispose', () => {
        delete roomMap[roomid];
        connectionToRoomInfo.delete(connection);
      });

      connection.sendUTF(JSON.stringify({
        status: 'ok',
        payload: {
          type: 'roomcreated',
          roomid,
          hostKey
        }
      }));
    } else if(command === 'joinroom') {
      // joinroomコマンドが来たら部屋に参加する
      const room = roomMap[payload.roomid];

      if(!room) {
        // 部屋が見つからなかったらエラー
        connection.sendUTF(JSON.stringify({
          status: 'error',
          payload: {
            message: 'Room Not Found'
          }
        }));
      } else {
        // 部屋が見つかったら接続
        room.joinConnection(connection);
        connection.sendUTF(JSON.stringify({
          status: 'ok',
          payload: {
            message: 'joined to room successfully'
          }
        }));
      }
    }
  });
});