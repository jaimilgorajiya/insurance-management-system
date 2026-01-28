# InsureCRM - Insurance Management System

A modern, full-stack Client Relationship Management (CRM) system designed for insurance agencies. This application streamlines the management of policies, customers, agents, and claims, enhanced with AI-powered features for better productivity.

## 🚀 Features

- **Role-Based Access Control (RBAC)**: secure portals for Admins, Managers, and Agents with granular permission settings.
- **Customer Management**: Comprehensive profiles, KYC status tracking, and policy history.
- **Policy Management**: Create, edit, and track various insurance policies (Life, Health, Motor, etc.).
- **AI-Powered Tools**:
  - **AI Email Assistant**: Auto-generate professional emails to clients using Google Gemini AI.
  - **Policy Summarizer**: Instant AI summaries of complex policy details.
- **Document Management**: Secure upload and storage for customer documents.
- **Dashboard & Analytics**: Real-time overview of active policies, revenue, and agent performance.
- **Interactive UI**: Clean, responsive interface built with React and Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
- **React.js** (Vite)
- **Tailwind CSS** (Styling)
- **Lucide React** (Icons)
- **Axios** (API Requests)

### Backend
- **Node.js & Express.js**
- **MongoDB** (Mongoose ODM)
- **JWT** (Authentication)
- **Google Generative AI** (Gemini Integration)
- **Multer** (File Handling)

## 📂 Project Structure

```
insurance-management-system/
├── frontend/       # React Client Application
├── backend/        # Node.js Express Server
└── README.md       # Project Documentation
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas URL)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/insurance-management-system.git
cd insurance-management-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```
**Configure Environment Variables:**
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
# Add other necessary keys (Cloudinary, Email service, etc.)
```
**Start the Server:**
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
```
**Configure Environment:**
Create a `.env` file in the `frontend/` directory if needed (usually handled by Vite config proxies):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
**Run the Client:**
```bash
npm run dev
# App runs on http://localhost:5173
```

## 🛡️ Security
- **Authentication**: Secure login with JSON Web Tokens (JWT).
- **Permissions**: Admins can configure granular permissions (e.g., "Send Email", "Approve KYC") for agents dynamically.
- **Data Protection**: Sensitive data is handled securely with proper backend validation.

## 🤝 Contributing
Contributions are welcome! Please fork the repository and create a pull request with your features or fixes.

## 📄 License
This project is licensed under the MIT License.
