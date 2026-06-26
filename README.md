# 🚀 Collaborative Document Workspace

A comprehensive full-stack rich-text document workspace featuring structural `.docx` file importing/exporting, robust user permission configurations, and user dashboard spaces. Built entirely on a decoupled TypeScript foundation.

---

## 📌 Features

- 🔐 **Identity Sandbox**: Simulates user session context with pre-seeded test profile switching.
- 📝 **Rich-Text Engine**: Fully functional headless text workspace supporting bold, italic, underline, headers, and bulleted/numbered list structures.
- 📤 **Bilateral DOCX Conversion**: Import native Microsoft Word files dynamically into clean web structures, and compile edited workspaces back into downloadable OpenXML documents.
- 💾 **Relational DB Operations**: Full CRUD routing connected to active transactional mappings (`users`, `documents`, `shares`).
- 👥 **Granular Access Control**: Share documents with unique individual permission flags (`view` vs `edit`).
- ⚡ **Optimized Storage Pipeline**: Enabled with SQLite Write-Ahead Logging (`WAL`) to maximize multiple simultaneous local read-write executions.

---

## 🛠️ Tech Stack

### Frontend
- React.js (v18.3.1)
- TypeScript
- Vite
- Tiptap Rich Text Editor (`@tiptap/react` & ProseMirror context)
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Better-SQLite3
- Mammoth.js (Word to HTML Ingestion)
- Docx Library (JSON Node to Word Generation)
- Multer (Multipart stream handling)

---

## 📂 Project Structure

ai-native-assignment/
│
├── client/                   # Frontend Workspace
│   ├── src/
│   │   ├── api/              # Axios interface setups
│   │   ├── components/       # Editor, MenuBar, FileImport, and Share dialog views
│   │   ├── context/          # Auth Context Simulation state
│   │   ├── pages/            # Login, Dashboard, and Document editor screens
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                   # Backend API Engine
│   ├── src/
│   │   ├── middleware/       # Identity evaluation blockades
│   │   ├── routes/           # Auth, Document handling, Sharing & Upload engines
│   │   ├── db.ts             # SQLite initialization & WAL setup
│   │   ├── seed.ts           # Mock database baseline populator
│   │   └── index.ts          # Core Express initialization entrypoint
│   └── package.json
│
├── docs-editor.db            # Generated Local Database Instance
└── README.md


---

## ⚙️ Installation

### 1. Position into Workspace Directory
```bash
cd ai-native-assignment
2. Configure Backend Engine
Bash
cd server
npm install
3. Initialize and Seed local DB
Bash
npm run seed
4. Configure Client Application
Bash
cd ../client
npm install
▶️ Running the Application
Start Backend Server Engine
From the server directory:

Bash
npm run dev
The REST interface will run at http://localhost:3001

Start Frontend UI Module
From the client directory:

Bash
npm run dev
The compilation loop will serve at the browser URL displayed by Vite (typically http://localhost:5173)

<img width="1920" height="1080" alt="Screenshot 2026-06-26 132728" src="https://github.com/user-attachments/assets/64683ef1-22db-4a51-b586-a3ddc187cba4" />
<img width="1920" height="1080" alt="Screenshot 2026-06-26 132711" src="https://github.com/user-attachments/assets/e5cd877b-6cd6-468a-86f5-99a26d1875ca" />
