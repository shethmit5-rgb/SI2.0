# SportSync Arena

SportSync Arena is a MERN-stack collegiate sports tournament management platform designed to streamline event registration, bracket scheduling, team collaboration, payment settlement, and real-time match results notification.

The system connects system administrators, event organizers, team coaches, student players, and sponsors into a unified web application. From secure payments via Razorpay to real-time status updates through WebSockets, the platform handles the complexity of managing multi-sport collegiate tournaments.

---

## Project Overview

Coordinating collegiate sports tournaments has traditionally relied on manual spreadsheets, email threads, and loose cash handling. SportSync Arena solves these coordination challenges by providing a role-based dashboard application. 

Key functions include:
- **Registration**: Capturing student player and team rosters, including automated email OTP validations.
- **Scheduling**: Creating and tracking match lineups across sports categories and physical venues.
- **Brackets**: Automated knockout (single-elimination) tournament bracket progression.
- **Payments**: Handling registration fees and team dues directly in-app via Razorpay integration.
- **Analytics**: Visual dashboards mapping participant growth and financial details.
- **Real-Time Sync**: Pushing live match scores and system alerts to active users immediately.

---

## Features

- **Multi-Step Onboarding**: Secure JWT registration flow containing user availability checks and 6-digit OTP validations sent via SMTP.
- **Role-Based Views**: Dynamic navigation menus and portal workspaces custom-loaded depending on the authenticated role.
- **Team Management**: Captain/Coach-led team creation, roster invite configurations, and member approval systems.
- **Tournament Operations**: Dynamic event creations including age groups, sports categories, fees, and location boundaries.
- **Automated Scheduling**: Match scheduling pipelines, venue availability verifications, and round-by-round knockout progression.
- **Razorpay Checkout**: Seamless payment gateways for tournament registration and team joining fees.
- **Real-Time Updates**: Immediate alert broadcasting and statistics synchronization via Socket.IO.
- **Offline Resiliency**: Hybrid fallback that switches to a 10-second REST polling loop if WebSocket connections disconnect.
- **Data Caching**: Frontend interceptor caching that holds GET request data in `sessionStorage` for 5 minutes.
- **Media Upload Pipeline**: Secure image processing using Multer and Cloudinary with automatic temporary file cleanup.
- **Database Migration Tool**: Resumable and idempotent script to migrate collections from local MongoDB to Atlas, complete with missing index recreation.

---

## User Roles

### Admin
- Full global control over all platform records.
- Manages users, teams, tournaments, and transactions.
- Configures sports categories and physical venue listings.
- Accesses global analytics, financial summaries, and audit logs.
- Performs manual overrides on transaction statuses if needed.

### Organizer
- Creates tournaments and validates participant registration checklists.
- Sets tournament rules, dates, venues, and registration fees.
- Manages match scheduling, updates scores, and advances brackets.
- Accesses organizer-specific dashboard analytics.

### Coach
- Creates teams and acts as team captain.
- Configures player joining fees for the team.
- Manages the team roster, approving or rejecting player applications.
- Registers teams for active tournaments and completes payment checkouts.

### Player
- Creates profiles, joins teams, and applies to roster invitations.
- Views tournament details, upcoming schedules, and active matchups.
- Pays individual joining fees via the in-app Razorpay checkout.
- Tracks registered events and personal notifications.

### Sponsor
- Accesses the sponsor dashboard to review campaign metrics and statistics.
- Manages sponsorship campaigns and tracks budget allocations.

---

## Technology Stack

### Frontend
- **React** (v18.2.0) - Core UI library.
- **Vite** (v7.2.4) - Build tool and development server.
- **React Router DOM** (v6.22.3) - Route management.
- **Chart.js** & **Recharts** - Data visualization and analytics dashboards.
- **Framer Motion** - Page transitions and animations.
- **Three.js** - WebGL-based dynamic canvas backdrops.
- **Axios** - HTTP client for backend communication.
- **Socket.IO Client** - Real-time WebSocket connection.

### Backend
- **Node.js** & **Express.js** (v5.2.1) - REST API server framework.
- **MongoDB** & **Mongoose** (v9.1.2) - ODM and database.
- **jsonwebtoken** & **bcryptjs** (v3.0.3) - Authentication and encryption.
- **Socket.IO** (v4.8.3) - WebSocket server management.
- **Nodemailer** (v8.0.5) - Email notifications and OTP dispatch.
- **Multer** & **Cloudinary** - Multipart file uploads and cloud storage.
- **Razorpay SDK** (v2.9.6) - Payment gateway processor.

---

## Project Architecture

SportSync Arena is structured as a client-server architecture consisting of a React Single Page Application (SPA) frontend and a Node.js Express REST API backend.

```
┌────────────────────────────────────────────────────────┐
│                        CLIENT                          │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │                    React                       │   │
│   │ ┌────────────────────────────────────────────┐ │   │
│   │ │           AuthContext / useAuth()          │ │   │
│   │ └────────────────────────────────────────────┘ │   │
│   │ ┌──────────────────────┐┌────────────────────┐ │   │
│   │ │      Three.js        ││   Framer Motion    │ │   │
│   │ │ WebGL Backdrop Canvas││  Page Transitions  │ │   │
│   │ └──────────────────────┘└────────────────────┘ │   │
│   │ ┌──────────────────────┐┌────────────────────┐ │   │
│   │ │  Route Guard Wrappers││  CSS Design System │ │   │
│   │ │ Admin/Organizer/Coach││ Light & Dark Theme │ │   │
│   │ └──────────────────────┘└────────────────────┘ │   │
│   └────────────────────────────────────────────────┘   │
│                           │                            │
│                  HTTPS    │    WebSockets              │
│               (REST APIs) │    (Socket.IO)             │
└───────────────────────────┼────────────────────────────┘
                            │
┌───────────────────────────┼────────────────────────────┐
│                        SERVER                          │
│                           ▼                            │
│   ┌────────────────────────────────────────────────┐   │
│   │                 Express.js                     │   │
│   │                                                │   │
│   │ ┌────────────────────┐┌──────────────────────┐ │   │
│   │ │    API Routers     ││ Middleware Pipeline  │ │   │
│   │ │ /api/auth, /api/.. ││ Auth, Roles, Upload │ │   │
│   │ └────────────────────┘└──────────────────────┘ │   │
│   │ ┌────────────────────────────────────────────┐ │   │
│   │ │           Controllers & Helpers            │ │   │
│   │ │    Bracket Logic, Payments, Schedulers     │ │   │
│   │ └────────────────────────────────────────────┘ │   │
│   └──────────────────────┬─────────────────────────┘   │
│                          │                             │
│       ┌──────────────────┼──────────────────┐          │
│       ▼                  ▼                  ▼          │
│ ┌───────────┐      ┌───────────┐      ┌───────────┐    │
│ │  MongoDB  │      │ Cloudinary│      │ Razorpay  │    │
│ │  Mongoose │      │ Storage   │      │ Payments  │    │
│ └───────────┘      └───────────┘      └───────────┘    │
└────────────────────────────────────────────────────────┘
```

### Frontend Architecture
- **Routing & Guards**: Routes are declared inside `App.jsx` and wrapped with custom components (`AdminRoute`, `NonOrganizerRoute`, `AdminOrOrganizerRoute`) to ensure page access aligns with user authorization.
- **Design Tokens**: Standardized CSS variables defined in `App.css` dictate layouts, colors, and styling rules. Theme switching (light/dark mode) is supported through `:root[data-theme="dark"]` selectors.
- **Axios Configuration**: A global instance in `axiosConfig.js` uses request interceptors to automatically fetch JWT tokens from `localStorage` and inject them as `Bearer` headers. Response interceptors handle `401 Unauthorized` codes by unlinking tokens and redirecting to the login page.
- **Request Cache**: GET requests are managed using a session storage helper that caches identical payloads for up to 5 minutes to reduce unnecessary backend requests.

### Backend Architecture
- **MVC Structure**: Standardized directory architecture separates routing paths, validation schemas (using `express-validator`), middlewares (authentication, roles, upload filters), and database controllers.
- **Real-Time Integration**: The HTTP server binds Socket.IO, mapping users dynamically to sockets on connection. Changes in match scores or tournament status automatically trigger broadcasts to connected client sessions.
- **Third-Party Services**: Integrates Nodemailer for SMTP email transport, Cloudinary for asset hosting, and the Razorpay SDK to handle digital payments.

---

## Folder Structure

```
react-clg-tournament-main/
├── Fronted/                # React Frontend (Vite)
│   ├── src/
│   │   ├── adminside/      # Admin dashboard pages and visual tools
│   │   ├── component/      # Shared header and footer layouts divided by role
│   │   ├── components/     # Reusable UI elements (Three.js canvas, skeletons)
│   │   ├── context/        # React AuthContext configuration
│   │   ├── layouts/        # Adaptive layout containers
│   │   ├── routes/         # Guard components for route protection
│   │   ├── screen/         # Main screens (Home, Profile, Match brackets)
│   │   ├── services/       # Network services (Razorpay checkout launcher)
│   │   ├── static/         # CSS styles mapped to specific screens
│   │   └── utils/          # Interceptors, socket connection, validation rules
│   ├── public/             # Static public assets
│   ├── vite.config.js      # Vite build configuration
│   └── package.json        # Frontend dependencies and scripts
└── backend/                # Express Backend
    ├── config/             # Connection configurations (Cloudinary, Nodemailer)
    ├── controllers/        # Application database controllers
    ├── middleware/         # Auth verify, role restrictions, and file upload
    ├── models/             # Mongoose schemas (User, Tournament, Team, Match)
    ├── routes/             # REST route path registrations
    ├── utils/              # Helper libraries (bracket calculators, retry utils)
    ├── validators/         # Input validation schemas (express-validator)
    ├── uploads/            # Temporary local directory for Multer uploads
    ├── migrate.js          # Standalone DB migration utility script
    ├── server.js           # Server initializer and socket bindings
    └── package.json        # Backend dependencies and scripts
```

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/shethmit5-rgb/SI2.0.git
cd SI2.0
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../Fronted
npm install
```

---

## Environment Variables

Create a `.env` file inside the `backend/` directory by copying `.env.example`:
```bash
cp backend/.env.example backend/.env
```

Define the configuration variables inside `backend/.env`.

| Key | Description | Example Value |
|:---|:---|:---|
| `MONGO_URI` | Connection URI for the MongoDB Database | `mongodb://localhost:27017/ArenaSync` |
| `JWT_SECRET` | Secret key used to sign authorization tokens | `your_jwt_secret_key` |
| `PORT` | Listening port for the backend server | `5000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary storage account name | `your_cloudinary_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary storage api key | `your_cloudinary_api_key` |
| `CLOUDINARY_API_SECRET`| Cloudinary storage api secret key | `your_cloudinary_api_secret` |
| `EMAIL_USER` | SMTP username used to dispatch verification mail | `your_email@gmail.com` |
| `EMAIL_PASS` | App password associated with the SMTP user | `your_email_app_password` |
| `FRONTEND_URL` | Access URL of the React client for CORS setups | `http://localhost:5173` |
| `FAST2SMS_API_KEY` | Optional SMS Gateway api key | `your_fast2sms_api_key` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID for payments checkout | `rzp_test_key_id` |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret key | `rzp_test_secret_key` |
| `ORGANIZER_TOURNAMENT_CREATION_FEE` | Base pricing fee in Paise | `50000` |

---

## Running the Project

### Start the Backend Server
From the `backend/` directory, execute:
```bash
npm start
```
The server will initialize on `http://localhost:5000`.

### Start the Frontend Dev Environment
From the `Fronted/` directory, execute:
```bash
npm run dev
```
Open `http://localhost:5173` in your web browser.

---

## Available Scripts

### Backend (`backend/package.json`)
- `npm start`: Runs the Node server using standard execution (`node server.js`).

### Frontend (`Fronted/package.json`)
- `npm run dev`: Runs the Vite local development server.
- `npm run build`: Compiles the source files into a production-ready bundle.
- `npm run preview`: Starts a local preview server serving the compiled build.

---

## Build & Production

### Frontend Compilation
To package the React frontend application for deployment, run:
```bash
cd Fronted
npm run build
```
This output is saved to the `Fronted/dist` directory containing optimized HTML, CSS, and JS assets.

### Production Backend Start
Ensure `NODE_ENV` is set appropriately in the hosting server configuration, configure the `.env` variables to connect to MongoDB Atlas, and execute:
```bash
cd backend
npm start
```

---

## Main Functional Modules

### User Authentication & Verification Flow
Registration uses a secure, email-validated workflow:
1. The frontend checks username and email availability before accepting registrations.
2. The server generates a random 6-digit OTP code, stores it in the `EmailOtp` collection, and sends it to the user's email using Nodemailer.
3. The registration is verified after the user submits the matching code. If valid, the user's record is created, and passwords are encrypted using `bcryptjs` (10 rounds).

### Team & Roster Operations
Coaches or captains can initialize teams by selecting a sport category. Once created, other players can apply to join the roster. Coaches manage incoming applications, approving or rejecting players. The roster limits are checked before final registration.

### Tournament Bracket Scheduling
When registration closes for a tournament, the scheduling controller organizes knockout brackets. It automatically creates round pairings based on registered teams and assigns them to available physical venues. When organizers report match scores, the bracket updates, declares the winner, and advances the victorious team to the next round.

### Real-Time Notifications & Analytics
A centralized Socket.IO setup tracks active client connections. Real-time updates are emitted on match events, user registrations, and sponsor status changes. If a client goes offline, the Axios client fallback triggers a 10-second REST polling sequence to pull status changes until the socket reconnects.

### Payment Processing Flow
1. **Order Creation**: The client requests a transaction. The backend initiates an order with the Razorpay API and creates a pending record in the `Transaction` collection.
2. **Checkout**: The client processes the checkout via the Razorpay Web SDK.
3. **Verification**: Razorpay sends back the order ID, payment ID, and signature. The server verifies this callback signature by generating an HMAC-SHA256 hash using its private key. If the signature matches, the transaction status is updated to `paid`, completing the registration.

### Temporary-to-Cloud Uploads Pipeline
Profile images are uploaded using a two-stage process. First, Multer intercepts the file and saves it locally in the `backend/uploads/` directory. Next, the controller uploads the image to Cloudinary, applying a 500x500px crop transform. Finally, the controller unlinks the temporary local file using `fs.unlinkSync()`, keeping the server clean.

### Standalone Database Migration Script
The project includes a utility script `migrate.js` to transfer database records from a local MongoDB instance to MongoDB Atlas:
- **Idempotency**: Checks if a document exists by ID before inserting.
- **Index Re-Creation**: Recreates missing database indexes on target collections.
- **Safety**: Insert-only design that does not drop or overwrite remote destination data.

---

## API Overview

| Route Prefix | Method | Endpoint | Description | Access |
|:---|:---|:---|:---|:---|
| **`/api`** | POST | `/register-email` | Check email/user availability | Public |
| | POST | `/send-email-otp` | Dispatch 6-digit verification code | Public |
| | POST | `/verify-email-otp`| Verify OTP validity | Public |
| | POST | `/register` | Complete account creation | Public |
| | POST | `/login` | Authenticate and retrieve JWT | Public |
| | POST | `/forgot-password` | Request password reset code | Public |
| **`/api/profile`** | GET | `/` | Fetch user profile details | Auth User |
| | PUT | `/update` | Update details (supports upload) | Auth User |
| **`/api/users`** | GET | `/` | Fetch user records list | Admin |
| **`/api/sports`** | POST | `/` | Create sports category | Admin |
| **`/api/teams`** | POST | `/create` | Create a new team | Coach |
| | POST | `/join` | Submit application to join team | Player |
| | PUT | `/approve-player` | Approve/reject roster application | Coach |
| **`/api/tournaments`**| GET | `/` | List all active tournaments | Public |
| | POST | `/` | Create a new tournament event | Admin/Organizer |
| **`/api/matches`** | POST | `/create` | Generate matchups | Admin/Organizer |
| | PUT | `/score/:id` | Update scores and resolve winner | Admin/Organizer |
| **`/api/payments`** | POST | `/order` | Initialize Razorpay order | Auth User |
| | POST | `/verify` | Verify Razorpay callback signature | Auth User |
| **`/api/analytics`** | GET | `/stats` | Fetch real-time dashboard data | Admin/Organizer |

---

## Authentication & Authorization

SportSync Arena enforces route security at both the network and layout levels:

### Backend Authorization
Backend API protection uses JSON Web Tokens (JWT) and custom middleware:
1. `authMiddleware.js`: Inspects the `Authorization` header, decodes the bearer token, verifies the signature, and attaches the user's role and details to the request.
2. `roleMiddleware.js`: Restricts access to endpoints based on user roles (`admin`, `organizer`, `coach`, `player`, `sponsor`).

### Frontend Route Guards
React Router DOM uses custom route wrapper guards:
- `AdminRoute`: Restricts page access to administrators.
- `NonOrganizerRoute`: Blocks users registered as organizers from coach or player features (e.g. team creation).
- `AdminOrOrganizerRoute`: Allows only administrators and organizers to access scheduling layouts and analytics.

---

## Security Features

- **CORS Config**: Express CORS middleware restricts API requests to the authorized frontend origin (`http://localhost:5173`).
- **Encrypted Password Storage**: Passwords are hashed using `bcryptjs` before database insertion. Cleartext passwords are never stored.
- **Crypto-Verified Payments**: Razorpay callbacks are verified using HMAC-SHA256 signature hashes to prevent invoice tampering.
- **Upload Restrictions**: Multer is restricted to image mime types and caps file sizes at 20MB.
- **Input Sanitization**: Express route parameters are validated using `express-validator` to prevent MongoDB injection.

---

## Deployment Notes

### MongoDB Database Compatibility
The database models are designed to run in environments without replica sets (useful for local databases). The prize distribution manager features a fallback handler: if a transaction fails due to replica set requirements, it retries the query in a non-transactional, standalone database operation.

### Seeding Initial Database Records
To seed coach users and generate teams for testing, configure the database connection in `playground-1.mongodb.js` and execute the script inside your MongoDB shell or compatible GUI tool.

### Local-to-Cloud Migration
Before launching the production application, migrate local development database records using the migration script:
```bash
node backend/migrate.js
```
*Note: Ensure `MONGO_URI` in the `.env` points to the destination MongoDB Atlas cluster.*

---

## Future Improvements

- **Interactive Drag-and-Drop Brackets**: Allow tournament organizers to modify pairings visually by dragging team cards into bracket slots.
- **Offline Bracket Caching**: Cache tournament schedules in local storage so users can access brackets and match times without an internet connection.
- **Winston Structured Logger**: Replace standard console logs with Winston to support log levels and file rotations.
- **Redis Cache Layer**: Implement a Redis cache to store active brackets and leaderboards, reducing database read operations during active tournaments.
- **Navbar Theme Switcher**: Add a dedicated button to the navbar to manually toggle between light and dark themes.

---

## License

This project is licensed under the MIT License.
