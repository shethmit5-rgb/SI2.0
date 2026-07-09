# SportSync Arena

SportSync Arena is a secure, real-time sports tournament management system designed to coordinate collegiate athletics. It automates registration, brackets, payments, and notifications across multiple user tiers.

[![Release](https://img.shields.io/badge/Release-v2.0-blue.svg?style=for-the-badge)](https://github.com/shethmit5-rgb/SI2.0)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg?style=for-the-badge)](https://github.com/shethmit5-rgb/SI2.0)

[![React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=white&style=flat-square)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
[![Node](https://img.shields.io/badge/Node-18+-green?logo=node.js&logoColor=white&style=flat-square)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-lightgrey?logo=express&logoColor=white&style=flat-square)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb&logoColor=white&style=flat-square)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-black?logo=socket.io&logoColor=white&style=flat-square)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-SDK-blue?logo=razorpay&logoColor=white&style=flat-square)](https://razorpay.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-API-blue?logo=cloudinary&logoColor=white&style=flat-square)](https://cloudinary.com/)

SportSync Arena connects administrators, organizers, coaches, players, and sponsors into a unified platform. It replaces manual scheduling, disconnected spreadsheets, and offline cash collections with role-adaptive dashboards, automated single-elimination brackets, and integrated payment flows.

---

## Features

### 🔐 Authentication & Onboarding
- Verified register flows using 6-digit email OTPs with a 5-minute expiration window.
- Secure, encrypted logins using password salting and JSON Web Tokens.
- Profile completion widgets including avatar uploads and validation checking.

### 🏆 Tournament Management
- Dynamic tournament creation specifying sport, location rules, date boundaries, and entry fees.
- Automated single-elimination bracket rendering and match-up generation.
- Result auditing that freezes standings once brackets finish.

### 👥 Team & Player Management
- Captain-led team creation and custom roster settings.
- Roster application approval systems restricting players based on team limits.
- Player join tracking displaying status details for each roster invite.

### 💻 Role-Adaptive Dashboards
- **Organizer Workspace**: Handles bracket updates, results inputs, and registration lists.
- **Coach Panel**: Configures roster join fees, manages player approvals, and processes sign-ups.
- **Sponsor Portal**: Audits sponsorship stats, budgets, and marketing details.
- **Admin Center**: Oversees global platforms, audits payments, and manages categories.

### 💳 Payments
- Seamless checkout integrations using Razorpay Web SDK.
- Secure signature verification matching payment callbacks against hash codes.
- Manual administrator overrides to reconcile pending cash transactions.

### 📊 Analytics & Live Sync
- Real-time matches tracking and bracket updates using WebSockets.
- Dynamic data graphs charting user enrollment and financial parameters.
- Offline connection failover that switches client requests to a REST poll sequence.

---

## Screens

<details>
<summary>🌐 Public Portal & Home</summary>

- **Landing Screen**: Features live stats counters, scheduled events summary, and sponsor banners.
- **Tournament List**: Filterable database of past, present, and upcoming tournaments.
- **FAQ & Information**: Static info sections detailing venue guides and system instructions.
</details>

<details>
<summary>🔑 Authentication & Profile Management</summary>

- **OTP verification**: Input interface verifying SMTP registration codes.
- **Security Recovery**: Password reset flows verifying accounts prior to modification.
- **Profile Center**: Upload forms updating user avatars and account details.
</details>

<details>
<summary>👥 Team Workspaces</summary>

- **Roster Dashboard**: Roster listing tracking active, pending, and rejected players.
- **Roster Controls**: Invites manager allowing captains to approve applications.
- **Details Page**: Public view showcasing team matches histories and win records.
</details>

<details>
<summary>🏆 Organizer & Bracket Dashboards</summary>

- **Matches Manager**: View of upcoming match pairings matching sports categories.
- **Bracket View**: Interactive canvas displaying knockout stages and match winners.
- **Registrations Manager**: Participant checking interface verifying enrollment fees.
</details>

<details>
<summary>📊 Sponsor & Admin Systems</summary>

- **Sponsorships Controller**: Dashboard tracking budgets, campaigns, and click ratios.
- **Admin Manager**: Global system panels managing users, venues, and sports records.
- **Analytics Center**: Financial spreadsheets and charts tracking registration trends.
</details>

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (v18.2.0), Vite (v7.2.4) | Single Page Application framework and build tool |
| **Routing** | React Router DOM (v6.22.3) | Client-side routes management and guards |
| **Backend** | Node.js, Express.js (v5.2.1) | Modular REST API server pipeline |
| **Database** | MongoDB, Mongoose (v9.1.2) | Document database and object modeling |
| **Real-time** | Socket.IO (v4.8.3) | Bi-directional WebSocket communication |
| **Payments** | Razorpay SDK (v2.9.6) | Digital payment gateways integration |
| **Storage** | Multer, Cloudinary API | File upload processing and media hosting |
| **Security** | jsonwebtoken, bcryptjs | Authorization tokens and credential salting |
| **Charts** | Chart.js, Recharts | Data visualization dashboards |
| **Animations** | Framer Motion, Three.js | Page transitions and WebGL background canvases |

---

## Folder Structure

```
react-clg-tournament-main/
├── Fronted/                # React Client (Vite)
│   ├── public/             # Static public assets
│   └── src/
│       ├── adminside/      # Admin panels and system controllers
│       ├── component/      # Headers and footers categorized by role
│       ├── components/     # Canvas components and skeleton loaders
│       ├── context/        # Auth Context configuration
│       ├── layouts/        # Layout wrappers matching user types
│       ├── routes/         # Route access guards
│       ├── screen/         # Public and dashboard views
│       ├── services/       # Checkout scripts
│       ├── static/         # Style sheets mapped to screens
│       └── utils/          # Axios interceptors and socket clients
└── backend/                # REST API Server (Express)
    ├── config/             # Cloudinary and Nodemailer connections
    ├── controllers/        # Route logic and controllers
    ├── middleware/         # Auth, validation, and upload filters
    ├── models/             # Mongoose schemas (Users, Matches, Tournaments)
    ├── routes/             # REST route path registrations
    ├── uploads/            # Temporary disk storage for files
    ├── utils/              # Bracket and payment helper scripts
    └── validators/         # Input schemas (express-validator)
```

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shethmit5-rgb/SI2.0.git
   cd SI2.0
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../Fronted
   npm install
   ```

---

## Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `MONGO_URI` | MongoDB Connection URL | `mongodb://localhost:27017/ArenaSync` |
| `JWT_SECRET` | Secret token signature string | `your_secret_hash_key` |
| `PORT` | Backend listening port | `5000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary storage account name | `your_cloudinary_name` |
| `CLOUDINARY_API_KEY` | Cloudinary access api key | `your_cloudinary_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary access secret key | `your_cloudinary_secret` |
| `EMAIL_USER` | Nodemailer SMTP email address | `system@gmail.com` |
| `EMAIL_PASS` | Nodemailer app credentials password | `smtp_app_password` |
| `FRONTEND_URL` | Client origin URL for CORS | `http://localhost:5173` |
| `FAST2SMS_API_KEY` | Optional SMS Gateway api key | `sms_api_key_here` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_key_id` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `rzp_test_key_secret` |
| `ORGANIZER_TOURNAMENT_CREATION_FEE` | Base cost for tournament creation (in Paise) | `50000` |

---

## Running

### Development
1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   *Server boots on `http://localhost:5000`.*

2. **Start the Vite client**
   ```bash
   cd Fronted
   npm run dev
   ```
   *Application available on `http://localhost:5173`.*

### Production Build
1. **Compile the React client**
   ```bash
   cd Fronted
   npm run build
   ```
   *Outputs optimized assets in `Fronted/dist/`.*

2. **Preview compilation locally**
   ```bash
   npm run preview
   ```

---

## Project Architecture

The system uses a Client-Server Architecture dividing layout renders from data operations:

```
┌────────────────────────────────────────────────────────┐
│                        Frontend                        │
│         (React SPA / AuthContext / Custom CSS)         │
└───────────────────────────┬────────────────────────────┘
                            │ (HTTPS REST API Requests)
                            ▼
┌────────────────────────────────────────────────────────┐
│                       REST API                         │
│             (Express Server Middleware)                │
└───────────────────────────┬────────────────────────────┘
                            │ (Decodes Authorization Bearer Token)
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Authentication                      │
│             (JWT Security & Role Checks)               │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │   MongoDB   │ │ Cloudinary  │ │  Razorpay   │
     │  Database   │ │ Media API   │ │ Payments API│
     └─────────────┘ └─────────────┘ └─────────────┘
```

- **Client Requests**: Network queries pass through Axios interceptors which inject authentication headers, manage cache storage, and catch expired sessions.
- **REST Middleware**: Routes run validation checks and check permissions against route restrictions.
- **Data Integrations**: Databases save document relations, Cloudinary stores profile avatars, and Razorpay validates transactions.

---

## User Roles

| Module / Permission | Admin | Organizer | Coach | Player | Sponsor |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Manage Sports & Venues** | Yes | No | No | No | No |
| **Create Tournament** | Yes | Yes | No | No | No |
| **Update Match Scores** | Yes | Yes | No | No | No |
| **Create Team** | Yes | No | Yes | No | No |
| **Manage Roster Approvals**| Yes | No | Yes | No | No |
| **Register & Pay for Events**| Yes | No | Yes | Yes | No |
| **View Sponsor Dashboard** | Yes | No | No | No | Yes |
| **System Audit Logs** | Yes | No | No | No | No |

---

## Major Modules

### 🔐 Auth & Roster Verification
Manages user onboarding using email availability checks, 6-digit verification code dispatch, and account profile creations. Integrates password hashing to secure stored data.

### 🏆 Knockout Bracket Generator
Organizes registered teams into match structures, schedules physical venues, calculates advancement paths, and updates tournament winners automatically.

### 💳 Transactions Pipeline
Connects to Razorpay APIs to generate order details and verify payments. Processes signature validations using HMAC-SHA256 hash checks before modifying enrollment databases.

### 📡 Real-Time Dashboards
Broadcasting channels using Socket.IO to push score changes and alerts to active screens. Features fallback routines that switch clients to short-polling loops if sockets drop.

### 🖼️ Profile Storage Pipeline
Handles image uploads using Multer and Cloudinary. Files are processed locally, transferred to cloud systems with crops applied, and then unlinked from the server disk.

### 🚀 Database Migration Utility
A standalone script (`migrate.js`) built to securely migrate database records from local MongoDB configurations to MongoDB Atlas instances while recreating indexes.

---

## API Overview

```
├── /api
│   ├── POST  /register-email       # Check account availability
│   ├── POST  /send-email-otp       # Send validation code
│   ├── POST  /verify-email-otp     # Verify code matches
│   ├── POST  /register             # Create profile records
│   └── POST  /login                # Authenticate and receive JWT
├── /api/profile
│   ├── GET   /                     # Fetch active profile
│   └── PUT   /update               # Edit profile avatar/details
├── /api/teams
│   ├── POST  /create               # Register new team rosters
│   ├── POST  /join                 # Submit player roster requests
│   └── PUT   /approve-player       # Manage team roster applications
├── /api/tournaments
│   ├── GET   /                     # List tournament entries
│   └── POST  /                     # Create tournament setups
├── /api/matches
│   ├── POST  /create               # Generate bracket matchups
│   └── PUT   /score/:id            # Save results and update brackets
└── /api/payments
    ├── POST  /order                # Create Razorpay orders
    └── POST  /verify               # Verify signatures and complete orders
```

---

## Security

- **JSON Web Tokens**: API endpoints require `Bearer` token verification in request headers.
- **Role Verification**: Middleware pipelines block requests matching incorrect user privileges.
- **Credential Protection**: Implements `bcryptjs` encryption mapping credentials to high-entropy hashes.
- **Payload Validation**: Uses `express-validator` to scrub request payloads and prevent injection attempts.
- **Payments Security**: Verifies checkout callbacks using cryptographically signed HMAC-SHA256 signature hashes.
- **Upload Restrictions**: Blocks image files exceeding 20MB and checks mime types.

---

## Future Improvements

- **Drag-and-Drop Match Brackets**: Visual bracket managers allowing organizers to restructure matchups directly.
- **Offline Bracket Caches**: Local storage caches permitting match structures checks without active network feeds.
- **Structured System Logger**: Integration of Winston loggers to manage system log level exports and folder rotations.
- **Redis Cache Database**: Key-value store caches caching active bracket listings to optimize database lookups.
- **Navbar Theme Toggler**: Dedicated switch components inside main header blocks to toggle light/dark designs.

---

## License

This project is licensed under the MIT License.
