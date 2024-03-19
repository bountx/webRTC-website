const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(express.static('public')); // Serve static files from 'public' directory

// Your Socket.io event handlers here
io.on("connection", (socket) => {
    let user = socket.handshake.query.user;
    console.log(user, "connected");
    socket.join(user);

    socket.on("makeCall", (data) => {
        let calleeId = data.calleeId;
        let sdpOffer = data.sdpOffer;

        socket.to(calleeId).emit("newCall", {
            callerId: user,
            sdpOffer: sdpOffer,
        });
    });

    socket.on("answerCall", (data) => {
        let callerId = data.callerId;
        let sdpAnswer = data.sdpAnswer;

        socket.to(callerId).emit("callAnswered", {
            callee: user,
            sdpAnswer: sdpAnswer,
        });
        console.log(socket.user, callerId, "Call Answered");
    });

    socket.on("IceCandidate", (data) => {
        let calleeId = data.calleeId;
        let iceCandidate = data.iceCandidate;

        socket.to(calleeId).emit("IceCandidate", {
            sender: user,
            iceCandidate: iceCandidate,
        });
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});