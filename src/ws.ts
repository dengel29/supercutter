import {Server } from 'socket.io';
import http from 'http';

const httpServer = http.createServer()
const io = new Server(httpServer, {
  path: '/updates',
  serveClient: false,
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
  cors: {
    origin: "http://localhost:3000",
  }
})

io.on("connection", (socket) => {
  console.log("we're connected")
  // Listen to chatMessage event sent by client and emit a chatMessage
  socket.on('supercutStarted', function(message){
    console.log(message)
    // io.to(message.receiver).emit('supercutStarted', message)
  })
});



