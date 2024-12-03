const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the HTTP server
const httpServer = app.listen(port, () => {
  console.log('HTTP server running!');
});

// WebSocket server for signaling
const wsServer = new WebSocket.Server({ server: httpServer });
const peers = new Set();

wsServer.on('connection', socket => {
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

console.log(`Signaling WebSocket server running on port: ${port}`);
