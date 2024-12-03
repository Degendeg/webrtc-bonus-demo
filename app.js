const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const signalingServer = new WebSocket('wss://web-rtc-demo-production.up.railway.app:8080');

const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

// Get local media (audio and video)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  })
  .catch(error => console.error('Error accessing media devices:', error));

// Send ICE candidates via signaling server
peerConnection.onicecandidate = event => {
  if (event.candidate) {
    signalingServer.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
  }
};

// Receive remote stream
peerConnection.ontrack = event => {
  remoteVideo.srcObject = event.streams[0];
};

// Handle incoming signaling messages
signalingServer.onmessage = async message => {
  const data = JSON.parse(message.data);

  if (data.type === 'offer') {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    signalingServer.send(JSON.stringify({ type: 'answer', answer }));
  } else if (data.type === 'answer') {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.type === 'candidate') {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};

// Start connection by sending offer (trigger this manually for now)
async function startCall() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  signalingServer.send(JSON.stringify({ type: 'offer', offer }));
}

// Start the call automatically when both peers are connected
signalingServer.onopen = () => {
  startCall();
};
