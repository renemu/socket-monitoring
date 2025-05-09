require('dotenv').config(); // load .env file

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Menyimpan daftar client: { id, name }
let clients = [];

function broadcastClients() {
  io.emit('client-list', clients);
}

function generateRandomTemperature() {
  return (20 + Math.random() * 10).toFixed(2);
}

io.on('connection', (socket) => {
  console.log('Client terhubung:', socket.id);

  // Tunggu nama client dari client
  socket.on('register', (name) => {
    clients.push({ id: socket.id, name });
    broadcastClients();
  });

  const interval = setInterval(() => {
    const suhu = generateRandomTemperature();
    socket.emit('suhu', { suhu, waktu: new Date().toISOString() });
  }, 2000);

  socket.on('disconnect', () => {
    console.log('Client terputus:', socket.id);
    clients = clients.filter(client => client.id !== socket.id);
    broadcastClients();
    clearInterval(interval);
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
server.listen(PORT, () => {
  console.log(`Server socket berjalan di http://${HOST}:${PORT}`);
});
