# 🏆 SportSync Arena
🏆 MERN Stack College Sports Tournament Management Platform

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/) 
[![Vite](https://img.shields.io/badge/Vite-7-purple.svg)](https://vitejs.dev/) 
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org/) 
[![Express](https://img.shields.io/badge/Express-5-lightgrey.svg)](https://expressjs.com/) 
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

SportSync Arena is a comprehensive MERN-stack college sports tournament management platform designed to streamline event registration, bracket scheduling, team collaboration, payment settlement, and real-time match results notification. 

---

## 📖 Overview

Organizing and tracking multi-sport collegiate tournaments involves coordination between admins, event organizers, coaches, sponsors, and players. SportSync Arena solves this coordination problem by providing a role-based, real-time dashboard. From payment checkouts via Razorpay to real-time status updates through WebSockets, the platform connects all stakeholders into a unified tournament hub.

---

## 🌟 Features

* **User Authentication**: Secure JWT-based registration and login, including verification OTP flows.
* **Role-Based Access**: Specialized layouts and dashboards for **Admins**, **Organizers**, **Players**, **Coaches**, and **Guests**.
* **Tournament Management**: Dynamic tournament creation, editing, registration fee setup, and status transitions.
* **Team Registration**: Easy captain-based team creation, player invites, and payment clearance checks.
* **Match Scheduling**: Automatic scheduling and tracking of matches.
* **Tournament Formats**: Support for single-elimination (Knockout) bracket progression and league setups.
* **Live Match Results**: Real-time score recording and match winner resolution.
* **Leaderboards & Analytics**: Live leaderboard updates and interactive admin charts.
* **Sponsor Portal**: Sponsor dashboard, sponsorship stats, and campaign tracking.
* **Payment Integration**: Razorpay SDK integration for team registrations and player joining fees.
* **Real-time Updates**: Socket.IO support for instant notifications and analytics syncing.
* **Email Alerts**: Automated mailers for verification codes and registration confirmations.

---

## 🛠️ Tech Stack

### Frontend
- **React** (v18.2.0)
- **Vite** (v7.2.4)
- **React Router DOM** (v6.22.3)
- **Chart.js** & **Recharts** (Visual analytics)
- **Framer Motion** (Smooth transitions and animations)
- **Three.js** (Interactive 3D background elements)
- **Axios** & **Socket.IO Client**

### Backend
- **Node.js** & **Express.js** (v5.2.1)
- **MongoDB** & **Mongoose** (v9.1.2)
- **JWT** (jsonwebtoken) & **bcryptjs** (Secure encryption)
- **Socket.IO** (v4.8.3)
- **Nodemailer** (Email dispatch)
- **Multer** & **Cloudinary** (Image hosting)
- **Razorpay SDK** (v2.9.6)

---

## 📁 Folder Structure

```
react-clg-tournament-main/
├── Fronted/                # React Frontend (Vite)
│   ├── src/
│   │   ├── adminside/      # Admin management panels (33 components)
│   │   ├── screen/         # Public screens (42 components)
│   │   ├── component/      # Shared header and footer layouts
│   │   ├── components/     # Canvas graphics, payment modules
│   │   ├── context/        # Global AuthContext
│   │   ├── layouts/        # Role-based container layouts
│   │   ├── routes/         # Guarded admin and player routes
│   │   ├── services/       # Razorpay order services
│   │   ├── static/         # Style configurations
│   │   └── utils/          # Axios setup, socket client, validators
│   ├── public/             # Static favicons
│   ├── vite.config.js
│   └── package.json
└── backend/                # Express Server
    ├── config/             # Cloudinary, mail, and database connections
    ├── controllers/        # Express controllers (auth, tournament, match, team)
    ├── middleware/         # Auth verify, role restrictions, upload
    ├── models/             # Mongoose schemas (User, Team, Tournament, Transaction)
    ├── routes/             # Express API routers
    ├── utils/              # Match helper algorithms, validations
    ├── uploads/            # Temporary upload destination
    ├── server.js           # Main entry point
    └── package.json
```

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/shethmit5-rgb/SI2.0.git
cd SI2.0
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory by copying `.env.example`:
```bash
cp backend/.env.example backend/.env
```
Fill in the configuration details inside `backend/.env`.

### 3. Install & Start Backend
```bash
cd backend
npm install
npm start
```
*The server will start listening at `http://localhost:5000`.*

### 4. Install & Start Frontend
```bash
cd ../Fronted
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser to view the application.*

---

## 🔑 Environment Variables

The backend relies on the following configurations:

| Key | Description | Example |
|---|---|---|
| `MONGO_URI` | MongoDB Connection URL | `mongodb://localhost:27017/ArenaSync` |
| `JWT_SECRET` | Secret key for JWT signatures | `your_secret_key` |
| `PORT` | Backend listening port | `5000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Account Name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_api_secret` |
| `EMAIL_USER` | Email address for SMTP transport | `system@gmail.com` |
| `EMAIL_PASS` | App password for SMTP transport | `email_app_password` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_key` |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key | `rzp_test_secret` |

---

## 📸 Screenshots

*Note: Visual capture walkthroughs will be placed in these slots upon deployment.*

### Home Page
*Placeholder for Home Page UI*

### Login
*Placeholder for Login Page*

### Dashboard
*Placeholder for User Dashboard*

### Tournament Details
*Placeholder for Tournament Info Page*

### Bracket View
*Placeholder for Elimination Match Bracket*

### Analytics Dashboard
*Placeholder for Visual Admin Analytics*

### Sponsor Portal
*Placeholder for Sponsor Portal Dashboard*

### Payment Page
*Placeholder for Razorpay Payment Window*

---

## 🔌 API Overview

* `POST /api/register` - Create user with OTP verification
* `POST /api/login` - Secure login returning JWT
* `GET /api/tournaments` - List all active tournaments
* `POST /api/tournaments` - Create new tournament (Admin/Organizer)
* `POST /api/teams` - Create team (Captain/Coach)
* `POST /api/payments/order` - Initialize Razorpay registration order
* `POST /api/payments/verify` - Securely verify Razorpay callback signature
* `GET /api/analytics/stats` - Fetch real-time dashboard data

---

## 🚀 Future Improvements

- [ ] Add automated SMS alerts via Twilio/Fast2SMS.
- [ ] Expand bracket generation to support Double-Elimination and Round-Robin leagues.
- [ ] Integrate real-time chat between teammates and tournament captains.
- [ ] Deploy mobile-friendly companion applications.

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE details.

---

## 👥 Author

* **Mit Sheth**
* GitHub: [shethmit5-rgb](https://github.com/shethmit5-rgb)

---

### Topics
`mern` · `react` · `nodejs` · `express` · `mongodb` · `socketio` · `tournament-management` · `sports` · `razorpay` · `jwt` · `vite` · `full-stack`
