# 🎓 CampusGrid - Smart Campus Operating System & Student Network

> **The entire campus. In your pocket.**
>
> **CampusGrid** is a production-ready, full-stack campus networking platform built with React, Node.js, Express, MongoDB, and Cloudinary. It features an integrated **AI Vector RAG (Retrieval-Augmented Generation) Search Engine** and **Document AI Chatbot ("Chat with PDF")**, institutional authentication, peer-reviewed academic resource sharing, verified placement drives, student directory networking, lost & found tracking, and a comprehensive admin management command center.

---

## ✨ Key Features & Capability Matrix

### 1. 🤖 Free-Tier AI Vector RAG Search & Document Chatbot
- **Passage-Level Vector Search**: Searches raw text passages inside all uploaded PDF study materials and PYQs with relevance match scores (e.g. `99% match`).
- **Paginated Passage Snippets**: Displays 4 passage cards per page with `Previous` / `Next` controls.
- **Document AI Workspace ("Chat with PDF")**: Dedicated workspace (`/hub/vault/chat/:resourceId`) to chat interactively with any specific PDF.
- **Page Number Citations**: Every AI response includes clickable page source badges (`📍 Page 2`, `📍 Page 4`) that open a preview drawer showing exact text passages from that page.
- **Dual Synthesis Engine**: Generative AI responses powered by Google Gemini 1.5 Flash (when `GEMINI_API_KEY` is set) or built-in Local Structured Synthesizer (guaranteeing 100% uptime with 0 API keys).
- **Custom Markdown Renderer**: Frontend custom renderer (`FormattedMarkdownText.jsx`) converts markdown headers, bold text, lists, and URLs into rich HTML elements.

### 2. 📚 Resource Vault & PDF Document Management
- **Academic Notes & PYQs**: Peer-uploaded previous year question papers, lab manuals, and notes sorted by Branch and Semester.
- **Strict PDF Validation & 15MB Limits**: Client and server validation enforcing strict `.pdf` file format checks up to **15MB**.
- **Automated Text Extraction & Chunking**: Node.js pipeline (`pdfProcessor.js`) extracts PDF text and creates 1,200-character overlapping chunks stored directly in MongoDB documents.
- **Owner & Admin Rights**: Resource uploaders and administrators can edit and delete uploaded study materials.
- **Direct Download Proxy**: Backend proxy (`/api/hub/resources/download/:id`) that streams documents natively as `attachment; filename="...pdf"` for clean offline viewing.
- **Upvote System**: Upvote resources to surface top-rated study materials.

### 3. 🔐 Institutional Authentication & Account Requests
- **Roll Number Access**: Access restricted by official Roll Number credentials.
- **Onboarding Request System**: New students can request account creation or password resets with specified reasons.
- **Admin Setup CLI**: Pre-configured admin bootstrap script to provision `ADMIN001` on fresh MongoDB instances.

### 4. 🛡️ Admin Command Center & Student Directory Management
- **Paginated Student Directory**: A responsive table displaying all registered students with pagination controls.
- **Student Account Deletion**: Admins can remove student accounts from the network.
- **Direct Password Override**: Admins can set or reset passwords for any registered student.
- **Pending Request Approvals**: One-click approval/rejection for student account creation and password reset requests.

### 5. 📢 Campus Feed & Peer Posts
- **Categorized Posts**: Filter feed posts by General, Announcements, Student Blogs, and Lost & Found.
- **Author & Admin Deletion**: Authors can delete their own posts, while Admins have platform-wide deletion privileges.
- **Image Attachments**: Multi-image attachments supported up to 10MB per file with built-in Cloudinary storage.
- **Engagement**: Interactive Likes and nested Commenting threads.

### 6. 💼 Training & Placement Cell
- **Placement & Internship Drives**: Admin-curated listings for verified placement drives and internships.
- **Eligibility & Details**: View company name, role type (Full-Time / Internship), CTC, eligibility details, and application URLs.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Tailwind CSS, Lucide React, Axios |
| **Backend** | Node.js, Express.js, Mongoose (MongoDB ORM), JSON Web Tokens (JWT), Bcrypt.js |
| **AI & RAG Engine** | `pdf-parse` Text Extractor, Node.js Cosine Similarity Engine, Google Gemini 1.5 Flash API |
| **Storage & Uploads** | Cloudinary API (RAW & Auto modes), Multer Storage (15MB PDF limit) |
| **Documentation** | [`ARCHITECTURE.md`](file:///e:/campusgrid/ARCHITECTURE.md) |

---

## 📁 Repository Structure

```
campusgrid/
├── ARCHITECTURE.md               # Detailed AI RAG Architecture & Design Specs
├── README.md                     # Project overview & quickstart guide
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection configuration
│   ├── controllers/
│   │   ├── adminController.js    # Student management & request processing
│   │   ├── authController.js     # Login, registration & requests
│   │   ├── hubController.js      # Vault resources, AI Search RAG, Chat & Jobs
│   │   ├── postController.js     # Feed posts, likes & comments
│   │   └── userController.js     # Student profile & follow network
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT protection & Admin guard
│   │   └── uploadMiddleware.js   # Multer & Cloudinary 15MB PDF limit
│   ├── models/
│   │   ├── Resource.js           # Vault resource & embedded chunks schema
│   │   └── User.js               # Student & Admin user schema
│   ├── utils/
│   │   └── pdfProcessor.js       # PDF text extraction, 1200-char chunking & page tracking
│   ├── routes/
│   │   └── hubRoutes.js          # Vault, AI Search RAG, Document Chat routes
│   └── server.js                 # Express server entry point
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── FormattedMarkdownText.jsx # Custom rich markdown renderer
    │   │   ├── ResourceAISearch.jsx      # AI Vector & Reference Search UI
    │   │   └── ResourceCard.jsx          # Vault note card with Ask AI & Read
    │   ├── pages/
    │   │   ├── DocumentChat.jsx   # Dedicated Document AI Chatbot Workspace
    │   │   └── Vault.jsx          # Resource Vault page
    │   └── App.jsx               # React Router DOM configuration
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup
```bash
cd backend
npm install
npm run server
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Default Credentials

| User Type | Roll Number | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `ADMIN001` | `adminpassword` | Full platform control, student overrides, approvals, post/job/resource management. |
| **Student** | Registered Roll No | Set Password | Upload PDFs, chat with Document AI, network with peers, and apply for placements. |

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
