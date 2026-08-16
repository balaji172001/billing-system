# ⚡ BillFlow — Full-Stack Billing & Invoicing System

A complete, state-of-the-art **Full-Stack Billing & Invoicing System** built with **React (Vite)**, **Node.js/Express**, and **MongoDB**. Features a glassmorphism dark dashboard, JWT authentication, client management, PDF invoice generation, payment tracking, recurring billing, and real-time financial analytics.

---

## ✨ Features

- 📊 **Financial Dashboard**: Real-time KPI summary cards, revenue trend area charts, status distribution pie charts, top clients list, and overdue payment alerts.
- 🧾 **Invoice Builder**: Itemized line-item creation with dynamic auto-calculation for subtotal, custom tax rates, discount percentages, and grand total.
- 📄 **PDF Generation & Emailing**: One-click inline PDF invoice downloads (via `pdfkit`) and automatic email dispatching with attachments (via `nodemailer`).
- 👥 **Client Management**: Searchable client database with contact information, tax/GST IDs, and avatar initial badges.
- 💳 **Payment Tracking**: Record invoice payments with transaction IDs and payment methods (Bank, Card, Cash, Other). Invoice statuses auto-update (`unpaid` → `partially_paid` → `paid`).
- 🔄 **Recurring Subscriptions**: Set up monthly or yearly subscription templates with manual or automated invoice generation.
- ⚙️ **Business Profile & Settings**: Custom business profile, tax rules, invoice numbering prefix (`INV-2026-0001`), bank payment details, and terms & conditions.
- 🔒 **Secure JWT Authentication**: Gated sign-in screen, bcrypt password hashing, token validation, auto-session logout, and route protection.
- 🎨 **Modular Component CSS**: 100% external modular CSS files per component with glassmorphism UI styling, neon status indicators, and a 360° rotating border accent animation on sign-in.
- 🏷️ **White-Labeling Support**: Centralized brand configuration file (`brand.js`) for instant rebrand customization across the entire application.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18 + Vite
- **Styling**: Vanilla CSS Variables (Design Tokens, Glassmorphism, Dark Mode)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Font**: Outfit (Google Fonts)

### **Backend**
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Security**: JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS, `dotenv`
- **PDF & Mail**: `pdfkit`, `nodemailer`

---

## 📁 Project Structure

```
billing-system/
├── backend/
│   ├── .env                    # Environment variables (secret credentials)
│   ├── .gitignore              # Excluded files for git
│   ├── package.json
│   ├── server.js               # Express API entry point & route protection
│   ├── seed.js                 # Database seeder script
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── models/
│   │   ├── Client.js           # Client schema
│   │   ├── Company.js          # Business profile & settings schema
│   │   ├── Invoice.js          # Invoice schema
│   │   ├── Payment.js          # Payment transaction schema
│   │   └── Subscription.js     # Recurring subscription schema
│   ├── routes/
│   │   ├── analytics.js        # Dashboard KPIs & charts API
│   │   ├── auth.js             # Sign-in & token verification routes
│   │   ├── clients.js          # Clients CRUD API
│   │   ├── company.js          # Company profile API
│   │   ├── invoices.js         # Invoices CRUD, PDF & Email API
│   │   ├── payments.js         # Payments API
│   │   └── subscriptions.js    # Subscription management & billing API
│   └── utils/
│       ├── emailService.js     # Nodemailer transporter & email logic
│       └── pdfGenerator.js     # PDFKit invoice generator
└── frontend/
    ├── index.html              # Root HTML template
    ├── vite.config.js          # Vite config & API proxy settings
    ├── package.json
    └── src/
        ├── brand.js            # White-label brand configuration
        ├── main.jsx             # React DOM entry point
        ├── App.jsx              # Root app component & auth router
        ├── App.css
        ├── index.css            # Global CSS variables & design tokens
        ├── components/
        │   ├── Clients.jsx & Clients.css
        │   ├── Dashboard.jsx & Dashboard.css
        │   ├── Dialog.jsx & Dialog.css
        │   ├── Invoices.jsx & Invoices.css
        │   ├── Login.jsx & Login.css
        │   ├── Payments.jsx & Payments.css
        │   ├── Settings.jsx & Settings.css
        │   ├── Sidebar.jsx & Sidebar.css
        │   └── Subscriptions.jsx & Subscriptions.css
        └── utils/
            ├── api.js           # Authenticated API client module
            └── helpers.js       # Formatting utilities (currency, dates, badges)
```

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js** v18+
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a **MongoDB Atlas** cloud cluster URI.

---

### **1. Backend Setup**

Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (refer to `.env.example` below):
```env
MONGODB_URI=mongodb://127.0.0.1:27017/billing-system
PORT=5001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$zFw2qwse7MSPGP6GpunkG.eCkdyXSQVbajERfeNG9lFD5vpF3cnLa
```

*(Optional)* **Seed Sample Data**:
```bash
node seed.js
```

Start the backend server:
```bash
npm run dev
# Server runs on http://localhost:5001
```

---

### **2. Frontend Setup**

Navigate to the `frontend` directory and install dependencies:
```bash
cd ../frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔐 Default Login Credentials

- **URL**: `http://localhost:5173`
- **Username**: `admin`
- **Password**: `admin123`

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | No |
| `POST` | `/api/auth/verify` | Verify active JWT token validity | No |
| `GET` | `/api/analytics` | Fetch summary KPIs, charts data & alerts | Yes |
| `GET`/`POST` | `/api/clients` | List (with search) or create clients | Yes |
| `PUT`/`DELETE` | `/api/clients/:id` | Update or delete client | Yes |
| `GET`/`POST` | `/api/invoices` | List (with filters) or create invoice | Yes |
| `GET` | `/api/invoices/:id/pdf` | Generate & download PDF invoice | Yes |
| `POST` | `/api/invoices/:id/send` | Email PDF invoice to client | Yes |
| `GET`/`POST` | `/api/payments` | List payments or record new payment | Yes |
| `GET`/`POST` | `/api/subscriptions` | List or create recurring subscriptions | Yes |
| `POST` | `/api/subscriptions/:id/trigger` | Manually trigger invoice generation | Yes |
| `GET`/`PUT` | `/api/company` | Get or update company profile settings | Yes |

---

## 🏷️ Rebranding / White-Labeling

To rebrand the software for another business or client, edit **`frontend/src/brand.js`**:

```javascript
const brand = {
  name: 'BillFlow',
  tagline: 'Premium Billing Suite',
  version: 'v1.0',
  title: 'BillFlow — Billing & Invoicing System',
  description: 'BillFlow — Premium Billing & Invoicing System.',
};

export default brand;
```

All UI references, page titles, and sidebar footers update instantly across the entire application.

---

## 📝 License

This project is licensed under the MIT License.
