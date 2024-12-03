const WebSocketServer = require('websocket').server;
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(404);
  res.end();
});

server.listen(8080, () => {
  console.log('Signaling server is running on ws://localhost:8080');
});

const wsServer = new WebSocketServer({ httpServer: server });
const peers = new Set();

wsServer.on('request', request => {
  const connection = request.accept(null, request.origin);
  peers.add(connection);
  console.log('New peer connected!');

  connection.on('message', message => {
    if (message.type === 'utf8') {
      const text = message.utf8Data;
      // Broadcast the message to all other peers
      for (let peer of peers) {
        if (peer !== connection) {
          peer.sendUTF(text);
        }
      }
    }
  });

  connection.on('close', () => {
    peers.delete(connection);
    console.log('Peer disconnected!');
  });
});
