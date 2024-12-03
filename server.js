const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });
const peers = new Set();

server.on('connection', socket => {
  peers.add(socket);
  console.log('New peer connected!');

  socket.on('message', message => {
    for (let peer of peers) {
      if (peer !== socket) {
        peer.send(message);
      }
    }
  });

  socket.on('close', () => {
    peers.delete(socket);
    console.log('Peer disconnected!');
  });
});

console.log('Signaling server is running on ws://localhost:8080');