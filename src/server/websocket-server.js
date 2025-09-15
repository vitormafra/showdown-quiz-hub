const WebSocket = require('ws');

// Criar servidor WebSocket no IP específico porta 8081
const wss = new WebSocket.Server({ 
  port: 8081,
  host: '192.168.0.14' // IP específico da rede
});

let connectedClients = new Set();

console.log('🚀 Quiz WebSocket Server rodando em 192.168.0.14:8081');
console.log('📡 Aguardando conexões de dispositivos...');

wss.on('connection', function connection(ws, req) {
  const clientIP = req.socket.remoteAddress;
  console.log(`📱 Novo cliente conectado: ${clientIP}`);
  
  connectedClients.add(ws);

  // Quando receber mensagem, retransmitir para todos os outros clientes
  ws.on('message', function incoming(data) {
    try {
      const message = JSON.parse(data);
      console.log(`📨 Mensagem recebida de ${clientIP}:`, message.type);
      
      // Retransmitir para todos os outros clientes conectados
      connectedClients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
          console.log(`📤 Retransmitindo para outro dispositivo:`, message.type);
        }
      });
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  });

  // Quando cliente desconectar
  ws.on('close', function close() {
    console.log(`📱 Cliente desconectado: ${clientIP}`);
    connectedClients.delete(ws);
  });

  // Tratar erros
  ws.on('error', function error(err) {
    console.error('❌ Erro WebSocket:', err);
    connectedClients.delete(ws);
  });

  // Enviar mensagem de boas-vindas
  ws.send(JSON.stringify({
    type: 'SERVER_READY',
    data: { message: 'Conectado ao servidor do quiz!' },
    timestamp: Date.now(),
    deviceId: 'server'
  }));
});

console.log('🌐 Para acessar de outros dispositivos: ws://192.168.0.14:8081');
console.log('💡 Use "node src/server/websocket-server.js" para iniciar');