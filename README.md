# 🎓 CampusGrid - Smart Campus Operating System & Student Network

> **The entire campus. In your pocket.**
>
> **CampusGrid** is a production-ready, full-stack campus networking platform built with React, Node.js, Express, MongoDB, and Cloudinary. It eliminates fragmented chat groups by providing institutional authentication, peer-reviewed academic resource sharing, verified placement drives, student directory networking, lost & found tracking, and a comprehensive admin management command center.

---

## ✨ Key Features & Capability Matrix

### 1. 🔐 Institutional Authentication & Account Requests
- **Roll Number Access**: Access restricted by official Roll Number credentials.
- **Onboarding Request System**: New students can request account creation or password resets with specified reasons.
- **Admin Setup CLI**: Pre-configured admin bootstrap script to provision `ADMIN001` on fresh MongoDB instances.

### 2. 📚 Resource Vault & Multi-Page Document Streaming
- **Academic Notes & PYQs**: Peer-uploaded previous year question papers, lab manuals, and notes sorted by Branch and Semester.
- **Raw Document Storage**: Uploads PDF, DOC, DOCX, and PPT files using Cloudinary `raw` mode to preserve full multi-page document structure.
- **Direct Download Proxy**: Backend proxy (`/api/hub/resources/download/:id`) that streams documents natively as `attachment; filename="...pdf"` for immediate multi-page offline viewing.
- **Upvote System**: Upvote resources to surface top-rated study materials.

### 3. 🛡️ Admin Command Center & Student Directory Management
- **Paginated Student Directory**: A responsive table displaying all registered students with 5 items per page limit, complete with Previous/Next pagination controls.
- **Student Account Deletion**: Admins can remove student accounts from the network.
- **Direct Password Override**: Admins can set or reset passwords for any registered student.
- **Pending Request Approvals**: One-click approval/rejection for student account creation and password reset requests.

### 4. 📢 Campus Feed & Peer Posts
- **Categorized Posts**: Filter feed posts by General, Announcements, Student Blogs, and Lost & Found.
- **Author & Admin Deletion**: Authors can delete their own posts, while Admins have platform-wide deletion privileges.
- **Image Attachments**: Multi-image attachments supported up to 10MB per file with built-in Cloudinary storage.
- **Engagement**: Interactive Likes and nested Commenting threads.

### 5. 💼 Training & Placement Cell
- **Placement & Internship Drives**: Admin-curated listings for verified placement drives and internships.
- **Eligibility & Details**: View company name, role type (Full-Time / Internship), CTC, eligibility details, and application URLs.
- **Admin Management**: Admins can post new drives and delete closed listings.

### 6. 🤝 Campus Network & Student Profiles
- **Searchable Directory**: Search students by full name, roll number, or filter by engineering department.
- **Peer Networking**: Follow/Unfollow system to build campus connections.
- **Custom React Modals**: Replaced native browser popups (`window.confirm`) with custom glassmorphic `ConfirmModal` UI components across all deletion flows.
- **Universal 10MB File Limits**: Client and server validation enforcing a 10MB maximum limit on image and document uploads.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Tailwind CSS, Lucide React, Axios |
| **Backend** | Node.js, Express.js, Mongoose (MongoDB ORM), JSON Web Tokens (JWT), Bcrypt.js |
| **Storage & Uploads** | Cloudinary API (RAW & Auto modes), Multer Storage |
| **Styling & Theme** | Modern Glassmorphism, Tailwind Dark Mode Support |

---

## 📁 Repository Structure

```
campusgrid/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection configuration
│   ├── controllers/
│   │   ├── adminController.js    # Student management & request processing
│   │   ├── authController.js     # Login, registration & requests
│   │   ├── hubController.js      # Vault resources & Placement drives
│   │   ├── postController.js     # Feed posts, likes & comments
│   │   └── userController.js     # Student profile & follow network
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT protection & Admin guard
│   │   └── uploadMiddleware.js   # Multer & Cloudinary 10MB storage limit
│   ├── models/
│   │   ├── AccountRequest.js     # Onboarding request schema
│   │   ├── Job.js                # Placement drive schema
│   │   ├── Post.js               # Feed post schema
│   │   ├── Resource.js           # Vault resource schema
│   │   └── User.js               # Student & Admin user schema
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── hubRoutes.js
│   │   ├── postRoutes.js
│   │   └── userRoutes.js
│   └── server.js                 # Express app & Multer error handler
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ConfirmModal.jsx  # Custom React deletion modal
    │   │   ├── DashboardLayout.jsx # Glassmorphic navigation layout
    │   │   ├── Loader.jsx        # Animated loading spinner
    │   │   └── PostCard.jsx      # Feed post card component
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx # Command Center & Paginated Directory
    │   │   ├── CampusNetwork.jsx  # Student directory & follow cards
    │   │   ├── Feed.jsx           # Campus updates & lost-found feed
    │   │   ├── Login.jsx          # Login & Account request modal
    │   │   ├── Placements.jsx     # Placement drives board
    │   │   ├── Profile.jsx        # Personal student profile
    │   │   ├── PublicProfile.jsx  # Peer profile view
    │   │   └── Vault.jsx          # Resource Vault & PDF downloads
    │   └── App.jsx               # React Router configuration
```

---

## 🚀 Quickstart Guide for Forkers & Contributors

### 1. Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (Local instance or MongoDB Atlas)
- **Cloudinary Account** (Free tier for media & raw document storage)

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install server dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `backend/`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/campusgrid
   JWT_SECRET=campusgrid_super_secret_jwt_key_2026

   # Cloudinary Credentials (Optional - Falls back to local /uploads/ if omitted)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   # or: npm run server
   ```

---

### 3. Bootstrap Initial Admin Credentials
Run the setup script to generate the default system administrator:
```bash
node -e "fetch('http://localhost:5000/api/auth/setup-admin', { method: 'POST' }).then(r => r.json()).then(console.log)"
```
- **Default Admin Roll No**: `ADMIN001`
- **Default Admin Password**: `adminpassword`

---

### 4. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `frontend/`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Launch Vite dev server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

---

## 🔑 Initial Admin & Testing Credentials

| User Type | Roll Number | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `ADMIN001` | `adminpassword` | Full control over student accounts, password overrides, request approvals, and deleting posts, resources, & jobs. |
| **Student** | Registered Roll No | Set Password | Post updates, upload study materials, apply for placement drives, and network with peers. |

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
