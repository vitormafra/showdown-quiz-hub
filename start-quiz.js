#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🎮 Iniciando Quiz Game Multi-Dispositivo...\n');

// Iniciar servidor WebSocket
console.log('🚀 1. Iniciando servidor WebSocket na porta 3001...');
const wsServer = spawn('node', ['src/server/websocket-server.js'], {
  stdio: 'pipe'
});

wsServer.stdout.on('data', (data) => {
  console.log(`📡 [WebSocket] ${data.toString().trim()}`);
});

wsServer.stderr.on('data', (data) => {
  console.error(`❌ [WebSocket] ${data.toString().trim()}`);
});

// Aguardar 2 segundos e iniciar aplicação React
setTimeout(() => {
  console.log('\n🎮 2. Iniciando aplicação React...');
  const reactApp = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit'
  });
  
  reactApp.on('close', (code) => {
    console.log(`\n🔄 Aplicação React encerrada (código ${code})`);
    wsServer.kill();
    process.exit(code);
  });
  
}, 2000);

// Tratar encerramento
process.on('SIGINT', () => {
  console.log('\n👋 Encerrando aplicação...');
  wsServer.kill();
  process.exit();
});

console.log('\n📱 INSTRUÇÕES:');
console.log('1. TV/Apresentação: Acesse /tv no navegador');
console.log('2. Jogadores: Acessem /player nos seus celulares');
console.log('3. Use o IP da rede local para outros dispositivos');
console.log('   Exemplo: http://192.168.1.100:8080/player\n');