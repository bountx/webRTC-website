const callerId = Math.floor(10000 + Math.random() * 90000).toString();
console.log('Your caller ID is: ' + callerId);

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    iceCandidatePoolSize: 10,
};
let peerConnection = new RTCPeerConnection();
let localStream = null;
let remoteStream = null;

socket = io.connect('http://localhost:5000', {
    query: "user=" + callerId,
});

let startWebcamButton = document.getElementById('webcamBtn');
let callButton = document.getElementById('callBtn');
let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');
let yourId = document.getElementById('yourId');
yourId.innerHTML = callerId;

startWebcamButton.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    remoteStream = new MediaStream();

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
    };

    localVideo.srcObject = localStream;
    remoteVideo.srcObject = remoteStream;
}

callButton.onclick = async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("makeCall", {
        calleeId: document.getElementById('calleeIdInput').value,
        sdpOffer: offer,
    });

    socket.on("callAnswered", async (data) => {
        await peerConnection.setRemoteDescription(data.sdpAnswer);
    });
}

socket.on("newCall", async (data) => {
    await peerConnection.setRemoteDescription(data.sdpOffer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answerCall", {
        callerId: data.callerId,
        sdpAnswer: answer,
    });
});

peerConnection.onicecandidate = event => {
    if (event.candidate) {
        socket.emit("IceCandidate", {
            calleeId: document.getElementById('calleeIdInput').value, // Or dynamically determine the recipient
            iceCandidate: event.candidate,
        });
    }
};

socket.on("IceCandidate", (data) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.iceCandidate)).catch(e => console.error(e));
});






