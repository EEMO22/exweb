# Master Guideline: Designer Portfolio Website Project

Hello. You are my assistant for building a designer portfolio website. This document contains the complete project specification. You must adhere to these guidelines strictly. I am a beginner with this tech stack, so please guide me in a step-by-step manner.

---

### **1. 🎯 Project Goal**

To create a clean, professional, and functional online platform where designers can effectively showcase their work and communicate with potential clients, employers, and a community.

### **2. 💻 Tech Stack & Environment**

- **Operating System**: **Windows 10**
- **Frontend**: **React**
- **State Management**: **Zustand** (Simple, Pinia-like API is preferred)
- **Styling**: **Tailwind CSS v4** (Utility-first approach)
- **Package Manager (Node.js)**: **pnpm**
- **Backend**: **Django** + **Django REST Framework (DRF)**
- **Database**: **PostgreSQL**
- **Package Manager (Python)**: **uv**

### **3. 🏛️ Core Architectural Principles**

- **Strict Separation of Concerns**: Frontend handles UI/UX only. Backend handles API and business logic only.
- **Stateless API**: Use **JWT (JSON Web Tokens)** for authentication. No server-side sessions.
- **Security First**: Validate all inputs on the backend (via DRF Serializers). Use the ORM correctly to prevent SQL injection.

### **4. 🧑‍🎨 User Roles & Permissions**

- **Designer (Owner)**:
  - Can sign up and log in.
  - Can create, read, update, and delete their **own** portfolios.
  - Can create, read, update, and delete their **own** posts and comments on the board.
  - Can manage their own user profile information.
- **Visitor (Guest)**:
  - Can browse all public portfolios and board posts without an account.
  - Can view designer profiles and their work.
  - Can see a designer's contact information (e.g., email), if provided.
- **Admin**:
  - Has full control over all users, portfolios, and posts.
  - Can moderate content and ban users if necessary.

### **5. 📝 Core Features & Pages**

- **Landing Page**:
  - Main hero section with a core message and image.
  - A "Featured Portfolios" section showcasing a curated list of works.
  - A clear Call-to-Action (CTA) button leading to the main portfolio gallery.
- **About Page**:
  - A static page explaining the vision and purpose of the website.
- **Portfolio Pages**:
  - **List View (`/portfolios`)**:
    - Displays all portfolios in a card or grid layout.
    - Provides filtering options by category (e.g., UI/UX, Branding, 3D).
  - **Detail View (`/portfolios/<id>`)**:
    - Shows project title, detailed description, and tech stack used.
    - Displays all associated media (images, videos).
    - Links to the profile of the designer who created it.
  - **Management (for logged-in Designers)**:
    - A form to create new portfolios, including media uploads.
    - Options to edit or delete existing portfolios.
- **Community Board Pages**:
  - **List View (`/board`)**:
    - Displays all posts with title, author, and creation date.
    - Includes pagination to handle many posts.
    - A search bar to find posts by title or content.
  - **Detail View (`/board/<id>`)**:
    - Shows the full content of the post.
    - Lists all comments for the post.
    - Provides a form to submit a new comment.
  - **Management (for logged-in authors)**:
    - A form with a rich text editor to create new posts.
    - Options to edit or delete their own posts.

### **6. 💾 Data Models (Database Schema)**

- **User (Custom User Model extending Django's AbstractUser)**:
  - `profile_image`: ImageField
  - `bio`: TextField
  - `job_title`: CharField (e.g., "UI/UX Designer")
- **Portfolio**:
  - `author`: ForeignKey to User
  - `title`: CharField
  - `description`: TextField
  - `category`: CharField (with choices like 'UI/UX', 'Branding', etc.)
  - `created_at`: DateTimeField (auto-add)
- **Media**:
  - `portfolio`: ForeignKey to Portfolio
  - `file_url`: FileField (for images or videos)
  - `media_type`: CharField (choices: 'image', 'video')
  - `order`: IntegerField (for ordering media within a portfolio)
- **Post**:
  - `author`: ForeignKey to User
  - `title`: CharField
  - `content`: TextField
- **Comment**:
  - `post`: ForeignKey to Post
  - `author`: ForeignKey to User
  - `content`: TextField

### **7. ↔️ High-Level API Endpoints**

- `POST /api/users/register/`: User registration.
- `POST /api/users/token/`: User login (to get JWT).
- `GET /api/portfolios/`: List all portfolios (with filtering).
- `POST /api/portfolios/`: Create a new portfolio (Authentication required).
- `GET /api/portfolios/{id}/`: Retrieve a single portfolio.
- `PUT /api/portfolios/{id}/`: Update a portfolio (Authentication + Ownership required).
- `DELETE /api/portfolios/{id}/`: Delete a portfolio (Authentication + Ownership required).
- `GET /api/posts/`: List all posts (with search and pagination).
- `POST /api/posts/{post_id}/comments/`: Create a new comment (Authentication required).

### **8. 🤖 Your Role as AI & My Requests for You**

1.  **Be Beginner-Friendly**: I am new to this stack. Explain the **"why"** behind the code, not just the "how".
2.  **Use a Step-by-Step Approach**: Break down large tasks into smaller, manageable steps. Guide me through them one by one.
3.  **Maintain Consistency**: All generated code **must** strictly follow the specifications in this document.
4.  **Ask Clarifying Questions**: If my request is ambiguous, ask for more details instead of making assumptions.
