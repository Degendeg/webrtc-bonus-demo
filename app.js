const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

const signalingServer = new WebSocket('ws://localhost:8080'); // Anslut till signaleringsservern

// Hämta lokala media (video och ljud)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  })
  .catch(error => console.error('Error accessing media devices.', error));

// Skicka ICE-kandidater via signaleringsservern
peerConnection.onicecandidate = event => {
  if (event.candidate) {
    signalingServer.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
  }
};

// Ta emot inkommande video och ljud
peerConnection.ontrack = event => {
  remoteVideo.srcObject = event.streams[0];
};

// Hantera inkommande meddelanden från signaleringsservern
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

// Starta anslutning genom att skicka offer
async function startCall() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  signalingServer.send(JSON.stringify({ type: 'offer', offer }));
}
