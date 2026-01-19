# DeChat – Caracteristici și Funcționalități

## Descriere Generală

**DeChat** este o aplicație de chat descentralizată (P2P) full-stack care demonstrează comunicarea pear-to-peer prin WebRTC cu semnalizare și persistență bazate pe server. Utilizatorii pot se conecta într-o rețea de mesagerie, pot descoperi și se conecta cu alți colegi, și pot trimite mesaje directe sau broadcast.

---

## Arhitectura Generală

### Straturile Aplicației
1. **Frontend** – React + Vite (TypeScript)
2. **Backend** – Node.js + Express + WebSocket (TypeScript)
3. **Persistență** – SQLite via sql.js
4. **Rețea** – WebRTC (P2P) + Semnalizare WebSocket
5. **Infrastructură** – Docker Compose, Kubernetes manifests, CI/CD cu GitHub Actions

---

## Caracteristici Backend

### 1. Semnalizare WebRTC
- **WebSocket Gateway** (`signalingGateway.ts`) – acceptă conexiuni WebSocket pe `/ws`
- **Autentificare API Key** – validează `SIGNALING_API_KEY` la handshake
- **Mesaje de semnalizare**:
  - `hello` – inițiază registrarea peelui cu ID și displayName
  - `signal` – retransmite mesajele SDP/ICE candidate între peeloți
  - `message` – mesaje chat de la/la peeloți
  - `peers` – cere lista de peeloți conectați activi

### 2. Gestionarea Peerilor
- **PeerRegistry** – înregistrează și urmărește peerlogii conectați
  - Stochează `peerId`, `displayName`, și `WebSocket` socket
  - Oferă căutare și enumerare de peeloți
  - Ștergeri automate la deconectare

### 3. Persistență Mesaje
- **Bază de date SQLite** (`db.ts`) – folosește `sql.js` (în memorie cu persistență pe disc la `backend/data/messages.sqlite`)
- **Schema tabelă `messages`**:
  - `id` (TEXT PRIMARY KEY) – UUID unic pentru fiecare mesaj
  - `senderId` (TEXT) – peerId expediitor
  - `sender_name` (TEXT NULLABLE) – displayName expeditor la momentul trimiterii
  - `receiverId` (TEXT NULLABLE) – peerId destinatar (NULL pentru broadcast)
  - `content` (TEXT) – conținut mesaj
  - `createdAt` (INTEGER) – timestamp Unix (ms)
- **Migrație automată** – adaugă coloana `sender_name` dacă lipsește la pornire

### 4. Servicii
- **MessageService** – logică creație și citire mesaje
  - Validare cu zod (conținut obligatoriu, senderName opțional)
  - Salvare în repository
- **MessageRepository** – CRUD pentru mesaje
  - `saveMessage(message)` – inserează mesaj nou
  - `getAllMessages()` – returnează toate mesajele din bază
  - `getMessagesByReceiver(receiverId)` – filtrează mesajele pentru un anumit peerid

### 5. API REST
- **GET `/health`** – health check, returnează `{ status: 'ok', timestamp }`
- **GET `/api/messages`** – returnează toate mesajele stocate cu metadate
- **POST `/api/messages`** – crează mesaj nou (corp: `{ senderId, senderName?, receiverId?, content }`)
- **GET `/api/peers`** – returnează lista de peeloți conectați activ

### 6. Configurație
- **Variabile mediu** (`.env`):
  - `PORT` (default 4000) – port ascultare server
  - `SIGNALING_API_KEY` (default empty) – cheie securitate autentificare
  - `ALLOWED_ORIGINS` – list CORS (default `http://localhost:5173`)
  - `SQLITE_PATH` – cale bază de date (default `data/messages.sqlite`)
  - `TURN_SERVER`, `TURN_USERNAME`, `TURN_PASSWORD` – configurare TURN server

---

## Caracteristici Frontend

### 1. Componente React
- **App.tsx** – root component, gestionează stare globală (displayName, enabled, activeConversation)
- **PeerList.tsx** – afișează lista peerilor conectați, buton "Conectează" pentru fiecare
- **MessageList.tsx** – afișează mesajele cu filtrare opțională pe activeConversation
  - Preferă displayName al peerului activ dacă conectat
  - Fallback pe `senderName` stocat și apoi pe `senderId`
  - Suportă vizualizare chat direct (P2P) sau broadcast
- **Composer.tsx** – input de mesaj și selector de conversație activ
  - Dropdown pentru selectare peeri / "Broadcast"
  - Button "Trimite" pentru submisie mesaj

### 2. Hook usePeerClient
- **Inițializare P2P** – crează RTCPeerConnection cu STUN/TURN config
- **WebSocket Signaling** – conectare la `VITE_SIGNALING_URL`, autentificare cu API key
- **Gestionare peeloți** – menține lista de peeloți și state conexiuni
- **Mesaje P2P** – canale date RTCDataChannel pentru mesaje directe, fallback REST
- **Broadcast** – POST la `/api/messages` pentru mesaje non-directe
- **Dependencies**:
  - `displayName` – actualizeaza `hello` message la schimbare
  - `enabled` – pornește/oprește semnalizarea

### 3. Servicii API
- **api.ts**:
  - `getMessages()` – GET `/api/messages` via `VITE_API_BASE_URL`
  - `postMessage(message)` – POST mesaj cu opțional `senderName`
  - Headers includ `X-API-Key` pentru autentificare

### 4. State Management
- **Zustand** – (opțional, structura permea-ready, dar nu critic pentru MVP)
- **Local state React** – displayName, activeConversation, conexiune status

### 5. Configurație
- **Variabile mediu** (`.env`):
  - `VITE_SIGNALING_URL` – WebSocket URL backend (e.g., `ws://localhost:4000/ws`)
  - `VITE_API_BASE_URL` – REST API URL backend (e.g., `http://localhost:4000`)
  - `VITE_SIGNALING_API_KEY` – API key autentificare

### 6. Build & Optimizări
- **Vite** – buildă rapid, output în `dist/`
- **TypeScript** – strict checking, type-safe
- **CSS modular** – `index.css` pentru stiluri globale și component-level styling

---

## Tipuri de Date Principale

### Backend
```typescript
interface StoredMessage {
  id: string;               // UUID unic
  senderId: string;          // peerId expeditor
  senderName?: string;       // displayName al expeditorului
  receiverId?: string;       // peerId destinatar (NULL = broadcast)
  content: string;           // conținut mesaj
  createdAt: number;         // timestamp Unix (ms)
}

interface PeerInfo {
  peerId: string;
  displayName: string;
}

type SignalMessage = 
  | { action: 'hello'; peerId: string; displayName: string }
  | { action: 'signal'; from: string; to: string; data: unknown }
  | { action: 'message'; from: string; to?: string; content: string }
  | { action: 'peers' }
```

### Frontend
```typescript
interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  receiverId?: string;
  content: string;
  createdAt: number;
}

interface PeerDescriptor {
  peerId: string;
  displayName: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
```

---

## Fluxuri Principale

### 1. Conectare la Rețea
1. User introduce alias (displayName) și apasă "Intră în rețea"
2. Frontend `usePeerClient` initializează WebSocket la `/ws?apiKey=...`
3. Frontend trimite mesaj `hello` cu peerId și displayName
4. Backend înregistrează peer în PeerRegistry
5. Backend retransmite lista de peeloți activi către client

### 2. Conectare P2P cu Alt Peelu
1. User apasă "Conectează" pe alt peer din lista
2. Frontend crează RTCPeerConnection, genereaza SDP offer
3. Oferta trimisă prin WebSocket (`signal` message) către alt peer
4. Peer receptor primește, crează RTCPeerConnection, returnează SDP answer
5. ICE candidates schimbate prin semnalizare WebSocket
6. DataChannel RTCDataChannel stabilit

### 3. Trimitere Mesaj Direct (P2P)
1. User selectează peelu în Composer
2. User scrie mesaj și apasă "Trimite"
3. Frontend trimite mesaj prin DataChannel RTCDataChannel (dacă conectat)
4. Fallback: POST mesaj la `/api/messages` cu `receiverId` și `senderName`
5. Backend stochează în SQLite și retransmite către peelu-receptor dacă conectat

### 4. Trimitere Mesaj Broadcast
1. User selectează "Broadcast" în Composer
2. Frontend POST la `/api/messages` cu `receiverId = null`
3. Backend stochează cu `receiverId = NULL`
4. Toate peelele conectate primesc notificare (dacă signaling forward implementat)

### 5. Ștergere Peer
1. Peelu se deconectează din rețea
2. Backend detectează socket close, îl șterge din PeerRegistry
3. Frontend cere lista actualizată de peeloți

---

## Testare

### Backend
- **Framework**: Jest
- **Test files**: `backend/test/*.test.ts`
- **Acoperire**: MessageService, MessageRepository, tipuri
- **Rulare**: `npm run test --workspace backend`

### Frontend
- **Framework**: Vitest + React Testing Library
- **Test files**: `frontend/src/**/__tests__/*.test.tsx`
- **Acoperire**: PeerList component
- **Rulare**: `npm run test --workspace frontend`

### Lint & Format
- **Backend**: `npm run lint --workspace backend`, `npm run format --workspace backend`
- **Frontend**: `npm run lint --workspace frontend`, `npm run format --workspace frontend`

---

## Containerizare

### Docker Compose
Servicii din `docker-compose.yml`:
1. **dechat-backend** – port 4000, build din `backend/Dockerfile`
   - Env: `SIGNALING_API_KEY=dev-api-key`, `ALLOWED_ORIGINS=*`
   - Volume: `backend/data/` pentru persistență SQLite
2. **dechat-frontend** – port 5173 (host) -> 4173 (container), build din `frontend/Dockerfile`
   - Build-time args: `VITE_SIGNALING_URL`, `VITE_API_BASE_URL`
3. **coturn** – port 3478 (UDP/TCP) – server TURN pentru traversare NAT
   - Config: docker image oficial coturn

### Docker Images
- `frontend/Dockerfile`:
  - Build stage: Node 20 alpine, npm install, vite build cu VITE_* args
  - Serve: nginx lightweight, copy dist/ la `/usr/share/nginx/html`
- `backend/Dockerfile`:
  - Single stage: Node 20 alpine, npm install, npm run build, npm start

---

## Kubernetes

### Manifests în `k8s/`
1. **configmap.yaml** – SIGNALING_API_KEY, ALLOWED_ORIGINS, SQLITE_PATH
2. **secret.yaml** – TURN_USERNAME, TURN_PASSWORD (base64 encoded)
3. **backend.yaml** – Deployment, Service (ClusterIP port 4000)
4. **frontend.yaml** – Deployment, Service (ClusterIP port 4173)
5. **ingress.yaml** – Ingress controller, route la `dechat.local`

### Deploy
```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```

---

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)
- **Trigger**: push/PR pe `main`
- **Jobs**:
  1. Lint backend & frontend
  2. Test backend & frontend
  3. Build Docker images (backend, frontend)
  4. (Opțional) push imagini la registry

---

## Dependențe Principale

### Backend
- **express** – HTTP server
- **ws** – WebSocket server
- **sql.js** – SQLite în memorie cu persistență disc
- **cors** – CORS middleware
- **zod** – validare scheme
- **uuid** – generare ID-uri
- **dotenv** – gestionare variabile mediu
- **jest, ts-node-dev, prettier, eslint** – testing, dev, formatting

### Frontend
- **react, react-dom** – UI framework
- **zustand** – state management (opțional)
- **vite** – build tool
- **vitest, @testing-library/react** – testing
- **prettier, eslint** – formatting, linting
- **typescript** – type safety

---

## Fluxul de Dezvoltare

### Setup local
1. Clone repo
2. `npm run install:all` – instaleaza dependențe backend + frontend
3. Copiază `.env.example` → `.env` în backend și frontend, actualizează valori
4. `npm run dev --workspace backend` (terminal 1)
5. `npm run dev --workspace frontend` (terminal 2)
6. Acceseaza `http://localhost:5173`

### Build
- **Local**: `npm run build --workspace backend`, `npm run build --workspace frontend`
- **Docker**: `docker compose up --build`

### Deploy
- **Docker Compose**: `docker compose up --build -d`
- **Kubernetes**: `kubectl apply -f k8s/*.yaml`

---

## Securitate

- **API Key Signaling** – SIGNALING_API_KEY validată la WebSocket handshake
- **CORS** – restricții origin-uri în backend
- **SQLite în memorie** – fără acces direct la bază din exterior
- **TLS/HTTPS** – încurajat în producție (nu configurat în MVP)
- **TURN server** – optional pentru traversare NAT în medii publice

---

## Observabilitate

- **Logging** – console.log în backend (serviciu, conexiuni)
- **Health check** – GET `/health` endpoint
- **Docker logs** – `docker compose logs <service>`
- **Status conexiune** – UI arată "disconnected", "connecting", "connected", "error"

---

## Limitări și Extinderi Viitoare

### Limitări actuale
- Mesajele din bază nu sunt criptate (SQLite plain text)
- Fără autentificare user (doar API key pentru semnalizare)
- Semnalizare nu retransmite mesaje salvate dacă peelu offline
- Zustand setup dar nu utilizat în MVP

### Extinderi posibile
1. **End-to-end encryption** – TweetNaCl, libsodium
2. **User accounts** – JWT, password hashing
3. **Offline message queue** – deliver pending mesaje la reconnect
4. **File sharing** – WebRTC data transfer, S3 storage
5. **Voice/Video** – RTCPeerConnection media streams
6. **Rate limiting** – token bucket, Redis
7. **Database upgrades** – PostgreSQL, MongoDB
8. **Frontend state management** – Zustand fully integrated

---

## Resurse și Referințe

- [WebRTC MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [sql.js](https://sql.js.org/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Kubernetes](https://kubernetes.io/)
- [GitHub Actions](https://github.com/features/actions)

---

**Versiune**: 0.1.0  
**Licență**: MIT  
**Status**: MVP / Active Development
