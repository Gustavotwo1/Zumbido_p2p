// server.js (Node.js)

const dgram = require('dgram');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const PORTA_HTTP = 3000;
const PORTA_UDP_LISTEN = 5000;

const socket = dgram.createSocket('udp4');
let wss = null;

// --- RECEBE ZUMBIDO VIA UDP ---
socket.on('message', (msg, rinfo) => {
    console.log(`[UDP] Zumbido recebido de: ${rinfo.address}:${rinfo.port}`);
    
    const data = JSON.parse(msg.toString());
    if (data.command === 'shake') {
        
        // Envia para o Frontend via WebSocket
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'zumbido_received',
                    sender: rinfo.address
                }));
            }
        });

        console.log("[WS] Notificação enviada ao frontend.");
    }
});

socket.bind(PORTA_UDP_LISTEN, () => {
    console.log(`[UDP] Escutando na porta ${PORTA_UDP_LISTEN}`);
});

// --- HTTP + WEBSOCKET ---
const app = express();
const server = http.createServer(app);
wss = new WebSocket.Server({ server, path: '/ws' });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// --- ENVIA ZUMBIDO PARA OUTRO PC ---
app.post('/api/send-zumbido', (req, res) => {
    const { targetIP, targetPort } = req.body;

    if (!targetIP || !targetPort) {
        return res.json({ status: "ERROR", message: "IP ou Porta inválidos" });
    }

    console.log(`[HTTP] Enviando zumbido para ${targetIP}:${targetPort}`);

    const command = {
        command: 'shake',
        sender: socket.address().address,
        ts: Date.now()
    };

    const msg = Buffer.from(JSON.stringify(command));

    socket.send(msg, 0, msg.length, targetPort, targetIP, (err) => {
        if (err) {
            console.log("[UDP] Erro:", err);
            return res.json({ status: "ERROR", message: "Falha no envio UDP" });
        }

        console.log(`[UDP] Zumbido enviado P2P para ${targetIP}:${targetPort}`);
        res.json({ status: "OK", message: "Zumbido enviado" });
    });
});

// --- INICIA SERVIDORES ---
server.listen(PORTA_HTTP, () => {
    console.log(`HTTP rodando: http://localhost:${PORTA_HTTP}`);
    console.log(`WebSocket: ws://localhost:${PORTA_HTTP}/ws`);
});
