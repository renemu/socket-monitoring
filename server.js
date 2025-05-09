require('dotenv').config(); // load .env file

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const date = new Date().toISOString();
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
    socket.emit('suhu', { suhu, waktu: date });
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

// Endpoint API untuk mengirim data suhu
app.get('/api/suhu', (req, res) => {
    const suhu = generateRandomTemperature();
    res.json({ suhu, waktu: date });
  });

// Endpoint API untuk menerima data suhu dari ESP32
app.post('/api/suhu', express.json(), (req, res) => {
    const { suhu, waktu } = req.body;
  
    if (!suhu) {
      return res.status(400).json({ error: 'Temperature is empty' });
    }
    
    console.log(`Data suhu diterima: ${suhu}°C pada ${waktu || date}`);
    io.emit('suhu-update', { suhu, waktu }); // Broadcast ke semua client melalui WebSocket
    res.status(200).json({ message: 'Data suhu berhasil diterima', suhu: `Data suhu diterima: ${suhu}°C pada ${waktu || date}` });
  });


const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
server.listen(PORT, () => {
  console.log(`Server socket berjalan di http://${HOST}:${PORT}`);
});
