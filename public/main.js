const callerId = Math.floor(10000 + Math.random() * 90000).toString();
console.log('Your caller ID is: ' + callerId);
const socket = io.connect('http://localhost:5000', {
    query: { user: callerId }
});

let localStream = null;
let peerConnection = null;
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Capture local video and display it
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        document.getElementById('localVideo').srcObject = stream;
        localStream = stream;
    }).catch(error => console.error('MediaStream Error', error));

socket.on('newCall', async (data) => {
    createPeerConnection();
    const offer = new RTCSessionDescription(data.sdpOffer);
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answerCall', { callerId: data.callerId, sdpAnswer: answer });
});

socket.on('callAnswered', async (data) => {
    const answer = new RTCSessionDescription(data.sdpAnswer);
    await peerConnection.setRemoteDescription(answer);
});

socket.on('IceCandidate', (data) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
});

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = event => {
        document.getElementById('remoteVideo').srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('IceCandidate', {
                calleeId: document.getElementById('calleeIdInput').value,
                iceCandidate: event.candidate
            });
        }
    };
}
