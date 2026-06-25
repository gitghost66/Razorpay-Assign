<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status Badge"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js Badge"/>
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express Badge"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL Badge"/>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5 Badge"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3 Badge"/>
  <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript Badge"/>
  
  <h1>💼 ReimburseX</h1>
  <p><b>Role-Based Access Control (RBAC) Reimbursements Management Tool</b></p>
  <p>A seamless and secure portal for org.com employees to submit, review, and approve expense claims.</p>
</div>

<hr/>

## ✨ Features
- **🛡️ Role-Based Access Control (RBAC):** Tailored views and permissions for different user roles (Employee, Manager, CFO, etc.).
- **📝 Seamless Claim Submission:** Easily submit new reimbursement claims with all necessary details.
- **✅ Approval Workflow:** Tiered approval process for managers and finance teams.
- **🔒 Secure Authentication:** Session-based authentication with encrypted passwords (`bcrypt`).
- **📱 Responsive UI:** A premium, modern, and dynamic user interface built with HTML, CSS, and Vanilla JavaScript.

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js (v20+), Express.js
- **Database:** PostgreSQL (`pg`)
- **Security & Auth:** `bcrypt` for password hashing, `express-session` for session management.

## 📂 Project Structure
```text
Razorpay-Assign/
├── Backend/               # Node.js + Express API
│   ├── src/               # Server logic, routes, controllers
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── ...
├── Frontend/              # Vanilla web frontend
│   ├── index.html         # Main application entry
│   ├── css/               # Styling, animations, and themes
│   ├── js/                # Client-side logic
│   └── serve.js           # Simple static file server
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.10.2 or higher)
- [PostgreSQL](https://www.postgresql.org/)

### 1. Database Setup
Ensure you have PostgreSQL running. Create a database for the project and configure the credentials.

### 2. Backend Setup
Navigate to the `Backend` directory:
```bash
cd Backend
```

Install dependencies:
```bash
npm install
```

Set up your environment variables by copying `.env.example` to `.env` and filling in your database details:
```bash
cp .env.example .env
```

Run database migrations and seed initial data:
```bash
npm run db:migrate
npm run db:seed-data
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the `Frontend` directory, and launch the application (you can use the provided `serve.js` or any static file server like Live Server):
```bash
cd Frontend
node serve.js
```
*Note: Make sure the frontend is configured to point to the correct backend API URL if needed.*

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

<div align="center">
  <p>Built with ❤️ for org.com</p>
</div>
