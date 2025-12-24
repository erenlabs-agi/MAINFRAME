const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dgram = require('dgram');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');

// --- SYSTEM CONFIG ---
const PORT = 8080;
const ARDUINO_UDP_PORT = 4210;         // For Controls (HID/Signal)
const TELEMETRY_UDP_PORT = 4211;       // For Incoming Data (ADC)

// --- EXPRESS SETUP ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- UDP SETUP ---
const udpSocket = dgram.createSocket('udp4'); // TX (Sender)
const udpReceiver = dgram.createSocket('udp4'); // RX (Listener)

app.use(cors());
app.use(express.static(__dirname)); // Serve root (index.html)
app.use(express.json());

// --- ROUTES ---
// File Upload / Vault (Legacy Support)
const VAULT_DIR = path.join(__dirname, 'vault');
if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR);
const upload = multer({ dest: VAULT_DIR });

app.post('/api/upload', upload.single('file'), (req, res) => {
    res.json({ status: 'ok', filename: req.file.filename });
});

app.post('/api/command', (req, res) => {
    // Legacy HTTP Proxy
    console.log("CMD:", req.body);
    res.json({ status: 'ok' });
});

// --- REAL-TIME CORE (SOCKET.IO) ---
io.on('connection', (socket) => {
    console.log('[SYSTEM] Client Connected:', socket.id);

    // 1. HID CONTROL (Macro Deck)
    socket.on('hid_control', ({ ip, cmd }) => {
        if (!ip || !cmd) return;
        // cmd is [type, mod, key]
        const buffer = Buffer.from(cmd);
        udpSocket.send(buffer, ARDUINO_UDP_PORT, ip, (err) => {
            if (err) console.error("UDP TX Error:", err);
        });
    });

    // 2. SIGNAL GENERATOR (Waveforms)
    socket.on('waveform_control', ({ ip, params }) => {
        if (!ip || !params) return;
        // params: [type, freq, amp] (uint32)
        const buffer = Buffer.alloc(12);
        buffer.writeUInt32LE(params[0], 0);
        buffer.writeUInt32LE(params[1], 4);
        buffer.writeUInt32LE(params[2], 8);
        udpSocket.send(buffer, ARDUINO_UDP_PORT, ip);
    });

    // 3. LED MATRIX (Frames)
    socket.on('frame_binary', ({ ip, frame }) => {
        // ... if we restore matrix
    });

    socket.on('disconnect', () => {
        console.log('[SYSTEM] Client Disconnected');
    });
});

// --- TELEMETRY RX ---
udpReceiver.on('message', (msg, rinfo) => {
    // Assuming Signal Data (2 bytes)
    if (msg.length >= 2) {
        const val = msg.readUInt16LE(0);
        io.emit('telemetry', { type: 'signal', val, from: rinfo.address });
    }
});

udpReceiver.bind(TELEMETRY_UDP_PORT, () => {
    console.log(`[SYSTEM] Telemetry Uplink Active on Port ${TELEMETRY_UDP_PORT}`);
});

// --- START ---
server.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║       MAINFRAME SYSTEM ONLINE            ║
    ║       http://localhost:${PORT}            ║
    ╚══════════════════════════════════════════╝
    `);
});
