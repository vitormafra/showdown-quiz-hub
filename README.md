# Quiz Game Multi-Dispositivo 🎮

Sistema de quiz interativo que permite jogadores se conectarem via WiFi usando seus celulares.

## 🚀 Como Usar

### Início Rápido
```bash
# Instalar dependências
npm install

# Iniciar o sistema completo (WebSocket + React)
node start-quiz.js
```

### Manual
```bash
# 1. Iniciar servidor WebSocket para comunicação entre dispositivos
node src/server/websocket-server.js

# 2. Em outro terminal, iniciar a aplicação React
npm run dev
```

## 📱 Acesso Multi-Dispositivo

1. **Inicie o servidor:**
   ```bash
   # Usando porta padrão (8080)
   node start-quiz.js
   
   # Ou especificando porta customizada
   node start-quiz.js 3000
   ```

2. **TV (Host):**
   - Acesse: `http://SEU_IP:PORTA/tv`
   - Exemplo: `http://192.168.1.10:8080/tv`
   - Mostre a tela na TV/projetor

3. **Jogadores:**
   - Acessem: `http://SEU_IP:PORTA/player`
   - Exemplo: `http://192.168.1.10:8080/player`
   - Cada jogador em seu próprio dispositivo móvel

## ⚙️ Configuração Automática

- ✅ **IP**: Detectado automaticamente da rede WiFi
- ✅ **Porta Web**: Configurável via parâmetro (padrão: 8080)
- ✅ **Porta WebSocket**: Auto-calculada (porta web + 1)
- ✅ **HTTPS/WSS**: Detectado automaticamente
- ✅ **Multiplataforma**: Funciona em qualquer rede local

### Exemplos de Uso:
```bash
# Porta 8080 (WebSocket: 8081)
node start-quiz.js 8080

# Porta 3000 (WebSocket: 3001)  
node start-quiz.js 3000

# Porta 5000 (WebSocket: 5001)
node start-quiz.js 5000
```

## 🔧 Tecnologia

- **WebSocket**: Comunicação em tempo real entre dispositivos na mesma rede WiFi
- **Auto-Config**: Detecção automática de IP/porta para máxima compatibilidade
- **React + TypeScript**: Interface do usuário moderna
- **Tailwind CSS**: Estilização responsiva e design system

## 🎯 Funcionalidades

- ✅ Reconhecimento automático de jogadores na rede
- ✅ Buzzer system - primeiro a apertar responde
- ✅ Detecção de conexão/desconexão em tempo real
- ✅ Pontuação automática
- ✅ Reset completo do jogo
- ✅ Interface responsiva para celulares e TV

## 📋 Desenvolvimento Original

Este projeto foi criado com Lovable. Para mais informações sobre desenvolvimento e deploy:

**URL**: https://lovable.dev/projects/5fcab197-9212-499f-9563-6d854188bce4
