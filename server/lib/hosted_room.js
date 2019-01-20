const EventEmitter = require('events').EventEmitter;

const closeReason = {
  hostHasLeft: 4000
};

class HostedRoom extends EventEmitter {
  constructor(hostConnection, key) {
    super();

    this._hostKey = key;
    this._hostConnection = hostConnection;
    this._connections = [];

    this._currentState = {};

    // ホストからメッセージが送られてきたら
    // 参加者にブロードキャストする
    hostConnection.on('message', (message) => {
      if(message.type === 'utf8') {
        try {
          const payload = JSON.parse(message.utf8Data).payload;
          const broadcastPayload = payload.broadcastPayload;
          if(broadcastPayload) {
            const dataToSend = JSON.stringify({
              status: 'ok',
              payload: broadcastPayload
            });

            this.broadcast(dataToSend);

            // メッセージのコマンドを現在の状態に反映
            if(broadcastPayload.command === 'starttimer') {
              this._currentState.startPayload = dataToSend;
            } else if(broadcastPayload.command === 'extendtimer') {
              this._currentState.extendPayload = dataToSend;
            } else if(broadcastPayload.command === 'unextendtimer') {
              delete this._currentState.extendPayload;
            } else if(broadcastPayload.command === 'resettimer') {
              this._currentState = {};
            }
          }
        } catch(e) {
          console.error('Invalid JSON message', message.utf8Data);
        }
      }
    });

    // ホストとの接続が切れたら部屋を破棄する
    hostConnection.on('close', (resonCode, description) => {
      this.dispose(closeReason.hostHasLeft);
    });
  }

  // コネクションをルームに参加させる
  joinConnection(connection) {
    this._connections.push(connection);

    if('startPayload' in this._currentState) {
      connection.sendUTF(this._currentState.startPayload);
    }

    if('extendPayload' in this._currentState) {
      connection.sendUTF(this._currentState.extendPayload);
    }

    // 切断時にコネクションの一覧から削除
    connection.on('close', (reasonCode, description) => {
      this.leaveConnection(connection);
    });
  }

  // コネクションをルームから退室
  leaveConnection(connection) {
    const index = this._connections.indexOf(connection);
    if(index > -1) {
      this._connections.splice(index, 1);
    }

    if(connection.connected) {
      connection.close();
    }
  }

  // メッセージを参加者にブロードキャストする
  broadcast(message) {
    for(const connection of this._connections) {
      connection.sendUTF(message);
    }
  }

  // 部屋を破棄する
  dispose(reasonCode) {
    for(const connection of this._connections) {
      connection.close(reasonCode);
    }

    this._connections = [];

    this.emit('dispose');
  }
}

module.exports = {
  HostedRoom
};