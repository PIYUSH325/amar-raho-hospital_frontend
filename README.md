# 🏥 Klinik Frontend - React & TypeScript Web Application

**React 18.2.0** | **TypeScript 5.2.2** | **Vite 5.0.0** | **Socket.IO Client** | **Agora RTC SDK**

Modern, responsive patient portal, doctor dashboard, and admin console for the **Klinik Hospital Management System**, built with React 18, TypeScript, and Vite.

---

## 📑 Table of Contents

- 🚀 Features
- 🛠️ Tech Stack
- 📁 Directory Structure
- ⚙️ Prerequisites
- 🏁 Getting Started
- 🔐 Environment Configuration
- 📜 Available Scripts
- 🧩 Key Modules and Dashboards
- 🔒 Security and Sensitive Data
- 📄 License

---

## 🚀 Features

### 🌐 Public Hospital Portal

- Home
- About
- Services
- Medical Staff / Doctors directory
- Contact form
- Testimonials

### 👤 Patient Dashboard

- 📅 Book and manage doctor appointments
- 📋 View digital medical records
- 🧪 View lab reports
- 💊 View doctor prescriptions
- 🍎 Interactive weekly diet calendar
- 🥗 Meal planner
- ✅ Diet compliance tracking
- 💬 Real-time chat with doctors
- 📎 Medical file attachments

### 👨‍⚕️ Doctor Dashboard

- 📅 Consultation schedule management
- 🔄 Appointment status updates
- 📋 Patient history inspection
- 💊 Digital prescription builder
- 🟢 One-click presence status toggle
- 💬 Real-time patient chat
- 📹 WebRTC / Agora telemedicine video calling

### 🛠️ Admin Management Console

- 📊 Hospital-wide statistics:
  - Patients
  - Doctors
  - Appointments
  - Revenue
- 👨‍⚕️ Doctor verification
- ✅ Account approvals
- 🩺 Specialty management
- 📄 Hospital policy document upload
- 🧠 Automatic AI RAG vector embedding synchronization
- 🤖 AI Assistant prompt customization
- 👋 AI greeting configuration

### 🤖 AI Health Assistant Widget

- 💬 Floating chatbot accessible across the entire platform
- 🩺 Symptom triage
- 👨‍⚕️ Doctor recommendations
- 🧠 Google Gemini AI integration
- 📚 Semantic RAG lookup against official hospital policies and FAQs

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Bundler & Tooling | Vite 5 |
| Routing | React Router v6 |
| Real-Time Client | Socket.IO Client |
| Telemedicine & Video | Agora RTC SDK NG / WebRTC |
| HTTP Client | Axios with centralized interceptors |
| Styling | Bootstrap 5 |
| Icons | FontAwesome |
| Component Styling | CSS Modules |

---

## 📁 Directory Structure

```text
frontend/
│
├── public/                         # Static assets
│   └── ...                         # Favicons, hospital images
│
├── src/
│   ├── assets/                     # Images, logos, stylesheet assets
│   │
│   ├── components/                # Reusable UI components
│   │   ├── AppointmentForm.tsx
│   │   ├── DietPlanBuilder.tsx
│   │   ├── HospitalAIChatbot.tsx
│   │   ├── LiveChatBox.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── WeeklyDietCalendar.tsx
│   │   └── WeeklyDietPlanner.tsx
│   │
│   ├── context/                   # Global React Contexts
│   │   ├── AuthContext
│   │   └── SocketContext
│   │
│   ├── layouts/                   # Page layouts and containers
│   │
│   ├── pages/                     # Route views
│   │   ├── AdminDashboard.tsx
│   │   ├── DoctorDashboard.tsx
│   │   ├── PatientDashboard.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Policies.tsx
│   │   └── Contact.tsx
│   │
│   ├── services/                  # Backend API clients
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── diet.ts
│   │
│   ├── types/                     # TypeScript interfaces and data models
│   │
│   ├── App.tsx                    # Root router definitions and routes
│   └── main.tsx                   # Vite React DOM entry point
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example                   # Environment configuration template
```

---

## ⚙️ Prerequisites

Before running the frontend, make sure you have:

- **Node.js >= 20.x** — tested on v22
- A running **Klinik Backend** instance
- Backend default URL:

```text
http://localhost:5001
```

---

## 🏁 Getting Started

### 1. Navigate to the frontend directory

```bash
cd klinik/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`.

#### Linux / macOS

```bash
cp .env.example .env
```

#### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### 4. Configure the Backend API URL

Inside `.env`:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

### 5. Start the development server

```bash
npm run dev
```

### 6. Open the application

```text
http://localhost:5173
```

---

## 🔐 Environment Configuration

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

> ⚠️ Do not place private secrets, passwords, or backend API keys in frontend environment variables. Values exposed through a Vite frontend are available to the client.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR) |
| `npm run build` | Type-checks with TypeScript and creates the production bundle in `dist/` |
| `npm run preview` | Locally previews the production build |

---

## 🧩 Key Modules and Dashboards

### 🔐 Authentication

Authentication and authorization are handled through:

- Login
- Registration
- JWT-based authentication
- Protected routes
- Role-based access

Supported roles:

```text
Patient
Doctor
Admin
```

### 🛡️ Protected Routes

The `ProtectedRoute` component controls access to protected pages based on authentication state and user role.

```text
User
 │
 ├── Patient ──→ Patient Dashboard
 │
 ├── Doctor ──→ Doctor Dashboard
 │
 └── Admin ───→ Admin Console
```

### 💬 Real-Time Communication

The frontend uses **Socket.IO Client** for real-time communication with the backend.

Supported functionality includes:

- Doctor-patient chat
- Real-time messages
- Medical file attachments
- Consultation communication

### 📹 Telemedicine

Video consultation functionality uses:

```text
Agora RTC SDK NG
        +
      WebRTC
```

### 🤖 AI Assistant

The `HospitalAIChatbot` component provides a floating AI assistant throughout the platform.

The assistant supports:

- Hospital-related questions
- Symptom triage
- Doctor recommendations
- Hospital policy / FAQ lookup through RAG

---

## 🔒 Security and Sensitive Data

The frontend follows these security practices:

- No private secrets, passwords, or backend API keys are stored in client-side code.
- Authentication state uses JWT tokens passed through `Authorization: Bearer` headers.
- `ProtectedRoute` provides role-based route protection for:
  - Patient
  - Doctor
  - Admin
- `.env` and `.env.local` files are ignored through `.gitignore`.

### Example Authorization Header

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔄 Frontend Application Flow

```text
                         ┌─────────────────────┐
                         │       Browser       │
                         │   React Frontend    │
                         └──────────┬──────────┘
                                    │
                                    ↓
                         ┌─────────────────────┐
                         │    React Router     │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ↓                  ↓                  ↓
          Patient Portal      Doctor Dashboard    Admin Console
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    ↓
                         ┌─────────────────────┐
                         │  Axios API Client  │
                         └──────────┬──────────┘
                                    │
                                    ↓
                         ┌─────────────────────┐
                         │   Klinik Backend   │
                         │    REST APIs       │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ↓                  ↓                  ↓
             PostgreSQL          MongoDB          Gemini / RAG
```


**MIT License**
