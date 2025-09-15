import { WebSocketServer } from 'ws';

// Sempre usar porta 8080 para o WebSocket (ou porta especificada via argumento)
const port = process.argv[2] || 8080;

// Criar servidor WebSocket no IP específico com configurações mais estáveis
const wss = new WebSocketServer({ 
  port: parseInt(port),
  host: '0.0.0.0', // Aceitar conexões de qualquer IP
  perMessageDeflate: false,
  clientTracking: true,
  maxPayload: 16 * 1024 * 1024 // 16MB
});

let deviceIdMap = new Map(); 
let connectedClients = new Set();
let clientHeartbeats = new Map();

// Configurações de heartbeat mais estáveis
const HEARTBEAT_INTERVAL = 20000; // 20 segundos
const MAX_MISSED_PINGS = 3;       // tolera até 3 pings (~1 minuto)

console.log(`🚀 Quiz WebSocket Server rodando na porta ${port}`);
console.log('📡 Aguardando conexões de dispositivos...');

wss.on('connection', function connection(ws, req) {
  const clientIP = req.socket.remoteAddress;
  console.log(`📱 Novo cliente conectado: ${clientIP}`);
  
  connectedClients.add(ws);
  
  // Configurar heartbeat
  ws.isAlive = true;
  ws.missedPings = 0;

  ws.on('pong', () => { 
    ws.isAlive = true; 
    ws.missedPings = 0;
  });
  
  const heartbeatInterval = setInterval(() => {
    if (!ws.isAlive) {
      ws.missedPings++;
      console.log(`⚠️ Cliente ${clientIP} não respondeu (${ws.missedPings}/${MAX_MISSED_PINGS})`);
      if (ws.missedPings >= MAX_MISSED_PINGS) {
        console.log(`❌ Cliente desconectado por inatividade: ${clientIP}`);
        clearInterval(heartbeatInterval);
        clientHeartbeats.delete(ws);
        return ws.terminate();
      }
    }
    ws.isAlive = false;
    ws.ping();
  }, HEARTBEAT_INTERVAL);
  
  clientHeartbeats.set(ws, heartbeatInterval);

  // Quando receber mensagem, retransmitir
  ws.on('message', function incoming(data) {
    try {
      const message = JSON.parse(data);
      console.log(`📨 [Server] Mensagem recebida:`, message);
      
      if (message.deviceId) {
        deviceIdMap.set(ws, message.deviceId);
        console.log(`🔗 [Server] Associando deviceId: ${message.deviceId}`);
      }
      
      connectedClients.forEach(client => {
        if (client !== ws && client.readyState === 1) {
          client.send(data);
          console.log(`📤 [Server] Retransmitindo:`, message.type);
        }
      });
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  });

  ws.on('close', function close() {
    console.log(`📱 Cliente desconectado: ${clientIP}`);
    if (clientHeartbeats.has(ws)) {
      clearInterval(clientHeartbeats.get(ws));
      clientHeartbeats.delete(ws);
    }
    if (deviceIdMap.has(ws)) {
      const deviceId = deviceIdMap.get(ws);
      console.log(`🗑️ [Server] Removendo deviceId: ${deviceId}`);
      deviceIdMap.delete(ws);
    }
    connectedClients.delete(ws);
    console.log(`👥 Clientes conectados (${connectedClients.size}):`, 
      Array.from(deviceIdMap.values()));
  });

  ws.on('error', function error(err) {
    console.error('❌ [Server] Erro WebSocket:', err);
    if (clientHeartbeats.has(ws)) {
      clearInterval(clientHeartbeats.get(ws));
      clientHeartbeats.delete(ws);
    }
    connectedClients.delete(ws);
    if (deviceIdMap.has(ws)) {
      deviceIdMap.delete(ws);
    }
  });

  // Mensagem de boas-vindas
  ws.send(JSON.stringify({
    type: 'SERVER_READY',
    data: { message: 'Conectado ao servidor do quiz!' },
    timestamp: Date.now(),
    deviceId: 'server'
  }));
});

console.log(`🌐 Para acessar de outros dispositivos: ws://SEU_IP:${port}`);
console.log('💡 Use "node src/server/websocket-server.js [porta]" para iniciar');
console.log('💡 Exemplo: node src/server/websocket-server.js 8081');
