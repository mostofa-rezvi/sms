
[![Stand With Palestine](https://raw.githubusercontent.com/TheBSD/StandWithPalestine/main/banner-no-action.svg)](https://thebsd.github.io/StandWithPalestine)

# CTP SMS Gateway

A complete SMS gateway ecosystem featuring:
- **PostgreSQL on Docker**: High-performance database layer with Prisma ORM.
- **Server on Docker**: Node.js, Express, TypeScript, and Prisma ORM running on port `8000`.
- **Client on Docker**: Modern React, TypeScript, Tailwind CSS, and Vite web dashboard served via Nginx on port `5173`.
- **App**: Flutter Android application that turns physical phones into SMS dispatch and receiving nodes.

---

## 1. Quick Start with Docker (Client, Server & Database)

You can launch the entire stack (PostgreSQL database, backend server, and frontend dashboard) with a single command:

```bash
docker compose up --build -d
```

### Services & Endpoints:
- **Web Client (Dashboard)**: [http://localhost:5173](http://localhost:5173)
  - Default API Key: `system-user-api-key`
- **Backend API**: [http://localhost:8000](http://localhost:8000)
  - Health check: [http://localhost:8000/health](http://localhost:8000/health)
  - Default User: `admin@ctpsms.com`
- **PostgreSQL Database**: Port `5432` (`postgres:password@localhost:5432/ctpsms`)

---

## 2. Running Local Development (Optional)

If you prefer running services directly on your host machine:

### Step 1: Start PostgreSQL Database in Docker
```bash
docker compose up postgres -d
```

### Step 2: Set Up and Start Server
```bash
cd server
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```
The server runs on `http://localhost:8000`.

### Step 3: Start Web Client (Dashboard)
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 3. Running Android / Flutter App

The mobile application connects to the backend to send and receive SMS via physical SIM cards.

```bash
cd app
flutter pub get
flutter run
```

### Configuration:
1. When launched, the Server URL defaults to `https://ctpsms-production.up.railway.app` (or your custom server URL).
2. Enter the API Key: `system-user-api-key`.
3. Provide your phone number in E.164 format (e.g., `+18005550199` or your local number with country code).
4. Grant the necessary SMS, Phone, and Notification permissions in the app.

---

## 4. Project Structure

- `docker-compose.yml`: Multi-container Docker configuration for PostgreSQL 16, Node.js server, and React/Nginx client.
- `server/`: Express + Prisma backend with REST APIs for messages, phones, heartbeats, contacts, threads, and webhooks.
- `client/`: Vite + React + Tailwind dashboard for sending SMS, managing phones, reviewing conversations, and generating API keys.
- `app/`: Flutter mobile app communicating with Android Telephony hardware to dispatch and receive SMS messages.
