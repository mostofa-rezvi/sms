# CTP SMS Gateway

A complete SMS gateway ecosystem featuring:
- **MySQL on Docker**: Database layer for persistent storage.
- **Server**: Node.js, Express, TypeScript, and Prisma ORM.
- **Client**: Modern React, TypeScript, Tailwind CSS, and Vite web dashboard.
- **App**: Flutter Android application that turns physical phones into SMS dispatch and receiving nodes.

---

## 1. Quick Start

### Step 1: Start MySQL Database in Docker
```bash
docker compose up -d
```
> **Note**: MySQL runs inside Docker and is mapped to port `3307` on the host to avoid port collisions with native Windows MySQL services.

### Step 2: Set Up and Start Server
```bash
cd server
npm install
npm run prisma:push
npm run seed
npm run dev
```
The server runs on `http://localhost:8000`.

- **Health check**: `http://localhost:8000/health`
- **Default API Key**: `system-user-api-key`
- **Default User**: `admin@ctpsms.com`

### Step 3: Start Web Client (Dashboard)
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. Log in with the default API Key: `system-user-api-key`.

### Step 4: Run Android / Flutter App
```bash
cd app
flutter pub get
flutter run
```
Configure Server URL to point to your computer's local IP (e.g., `http://192.168.x.x:8000`) and login with `system-user-api-key`.

---

## 2. Project Structure
- `docker-compose.yml`: Docker configuration for MySQL 8.0.
- `server/`: Express + Prisma backend with REST APIs for messages, phones, heartbeats, contacts, threads, and webhooks.
- `client/`: Vite + React + Tailwind dashboard for sending SMS, managing phones, reviewing conversations, and generating API keys.
- `app/`: Flutter mobile app communicating with Android Telephony hardware to dispatch and receive SMS messages.
