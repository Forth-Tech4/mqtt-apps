# MQTT Client Web Application

A secure MQTT client web application built with **React** for the frontend and **Node.js/Express** for the backend. The backend supports **TLS client certificate authentication**, MQTT message handling, and real-time **WebSocket** communication to deliver subscribed MQTT messages to connected clients.

---

## 📚 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [Security Considerations](#security-considerations)
- [UI](#ui)
- [Contributing](#contributing)

---

## ✅ Features

- Secure MQTT connection using **TLS client certificates** (`client.key`, `client.crt`, and `ca.crt`)
- Express API for uploading certificates and managing MQTT connection
- Real-time MQTT message subscription and publication through **WebSocket**
- React UI to subscribe to topics under the authenticated client's namespace
- Client-side validation restricting subscription topics based on client ID (CN)
- Toast notifications for user feedback
- Graceful handling of MQTT errors and certificate failures
- **CORS** configuration allowing specific frontend origins
- Responsive, clean UI with **Tailwind CSS**

---

## 🛠 Technology Stack

- **Frontend**: React, Tailwind CSS, react-toastify
- **Backend**: Node.js, Express, mqtt.js, multer, WebSocket (`ws` package)
- **Security**: TLS Client Certificate Authentication for MQTT
- **Build & Run**: Node.js v14+, npm/yarn

---

## 🏗 Architecture

```
[React Frontend] <-- WebSocket --> [Node.js Backend (Express + WS)] <-- MQTT TLS --> [MQTT Broker]
```

- Frontend connects via **WebSocket** to backend for real-time MQTT message streaming  
- Backend connects to MQTT broker with client certificates for authentication  
- MQTT messages received by backend are broadcast to subscribed WebSocket clients  
- Clients can publish MQTT messages through WebSocket to backend  
- Topic subscriptions are restricted to the client's own **CN namespace**

---

## 🔧 Prerequisites

- MQTT broker with **TLS client certificate** support
- Node.js v14 or higher
- npm or yarn
- Valid TLS certificates for client authentication:
  - `client.key` (private key)
  - `client.crt` (client certificate)
  - `ca.crt` (CA certificate used to sign broker and client certs)

---

## 📥 Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/mqtt-client-app.git
cd mqtt-client-app
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### Backend

- Certificates are uploaded via the `/upload-certs` API endpoint
- Allowed CORS origins are set in `server.js` — update as needed
- MQTT connection options use uploaded certificates
- MQTT broker hostname and port are provided during certificate upload

### Frontend

- Client ID (CN) is extracted from the certificate and used for topic filtering
- Update `vite.config.js` or `.env` for different environments

---

## 🚀 Running the Application

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

> Server listens on **port 3001** by default.

### 2. Start Frontend Server (Development)

```bash
cd frontend
npm run dev
```

> Frontend typically runs on `http://localhost:5173`

---

## 🧪 Usage

1. Upload your client certificates (`client.key`, `client.crt`, `ca.crt`) and provide the MQTT broker hostname and port via the frontend UI or API.
2. The backend establishes a **TLS-secured MQTT** connection and extracts your **client ID (CN)** from the certificate.
3. Use the **Subscriber UI** to subscribe to topics under your CN namespace (e.g., `yourClientId/#`).
4. Messages are received in real-time and shown in the **Receiver** component via WebSocket.
5. Publish messages to allowed topics through the UI.
6. Toast notifications show connection, error, and feedback statuses.

---

## 📂 Folder Structure

```
mqtt-client-app/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── websocket/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── assets/
│   |   ├── components/
│   |   ├── hooks/
│   |   ├── utils/
│   |   ├── App.css
│   |   ├── App.jsx
│   ├── index.css
│   |── main.jsx
│   ├── package.json
│   └── vite.config.js
```

---

## 🔒 Security Considerations

- TLS **client certificate authentication** enforces identity-based MQTT access
- Topic subscriptions are validated on **frontend and backend**
- CORS is restricted to trusted frontend origins
- MQTT reconnect loops are disabled to prevent flooding
- Uploaded certificates are stored temporarily (`uploads/`) — implement cleanup policies
- WebSocket messages scoped to authorized topics only

---

## 🤝UI

![screencapture-localhost-5173-2025-05-16-15_32_32](https://github.com/user-attachments/assets/39fa733c-2ca8-4c87-96ae-479a5c30f57e)


## 🤝 Contributing

Contributions are welcome!  
Please open issues or submit pull requests to fix bugs, improve features, or suggest enhancements.

---
