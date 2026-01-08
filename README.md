# DeChat – Sistem de Mesagerie Descentralizat

Aplicație full-stack ce demonstrează un flux de chat P2P: clienții schimbă mesaje prin canale WebRTC, iar un serviciu Node.js gestionează doar semnalizarea, metadatele și persistența mesajelor într-o bază locală SQLite. Stiva este pregătită pentru containere Docker și rulare în Kubernetes.

## Arhitectură

- **Frontend (React + Vite, TypeScript)** – UI pentru descoperirea peer-ilor, stabilirea conexiunilor WebRTC și trimiterea mesajelor.
- **Backend (Node.js + Express + WebSocket)** – expune API REST minim pentru health și istoric mesaje, oferă gateway de semnalizare WebRTC și persistă mesajele.
- **P2P Messaging** – conexiuni WebRTC data-channel între clienți, cu fallback prin broadcast/REST pentru confirmări.
- **Persistență** – SQLite accesat prin `better-sqlite3` și repository pattern simplu.
- **Observabilitate/Testare** – Jest pentru backend, Vitest + React Testing Library pentru frontend, ESLint + Prettier în ambele părți.

## Cerințe

- Node.js 20+
- npm 10+
- Docker & Docker Compose (opțional pentru rulare containerizată)
- Kubectl + un cluster compatibil Kubernetes (opțional pentru deploy)

## Configurație rapidă

1. Copiază fișierele `.env.example` în `.env` în `backend` și `frontend`, apoi actualizează valorile.
2. Instalează dependențele:
   ```powershell
   npm run install:all
   ```
3. Rulează serviciile în mod dezvoltare în două terminale:
   ```powershell
   npm run dev --workspace backend
   npm run dev --workspace frontend
   ```
4. Deschide `http://localhost:5173` și conectează cel puțin doi clienți pentru a testa chat-ul.

## Testare și verificări

```powershell
npm run lint --workspace backend
npm run test --workspace backend
npm run lint --workspace frontend
npm run test --workspace frontend
```

## Docker Compose

1. Construiește imaginile și pornește stack-ul:
   ```powershell
   docker compose up --build
   ```
2. Accesează UI-ul la `http://localhost:5173`. Serviciul de semnalizare este expus la `http://localhost:4000`.

## Kubernetes (exemplu)

1. Actualizează imaginile din `k8s/backend.yaml` și `k8s/frontend.yaml` cu registry-ul tău.
2. Aplică resursele în cluster:
   ```powershell
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/backend.yaml
   kubectl apply -f k8s/frontend.yaml
   kubectl apply -f k8s/ingress.yaml
   ```
3. Configurează DNS / hosts către `dechat.local` sau adaptează ingress-ul.

## GitHub Actions

Workflow-ul din `.github/workflows/ci.yml` rulează automat lint + teste pentru ambele părți și execută build-ul Docker la fiecare push/pull request pe `main`.
