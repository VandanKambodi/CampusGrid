# CampusGrid Resource Vault - AI RAG System Architecture & Design Documentation

## Executive Summary

CampusGrid's **Resource Vault** features an end-to-end **Retrieval-Augmented Generation (RAG)** architecture and dedicated **Document AI Chatbot ("Chat with PDF")** system. It allows students to upload, organize, search inside, and interactively chat with academic study notes, previous year examination papers, and lab manuals.

The entire system is engineered to run **100% on Free-Tier infrastructure** without requiring mandatory third-party subscriptions or paid API keys.

---

## System Architecture Diagram

```
┌───────────────────────────┐         ┌───────────────────────────┐
│     Frontend (React)      │         │     Cloudinary Storage    │
├───────────────────────────┤         ├───────────────────────────┤
│ • Resource Vault Page     │         │ • Secure Raw PDF Storage  │
│ • ResourceAISearch (RAG)  │         │ • CDN Distribution        │
│ • DocumentChat Workspace  │         └─────────────┬─────────────┘
│ • FormattedMarkdownText   │                       │
└─────────────┬─────────────┘                       │
              │ HTTP / REST                         │ PDF Buffer Stream
              ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js/Express)             │
├─────────────────────────────────────────────────────────────────┤
│ • uploadMiddleware: Strict .pdf filter & 15MB size limit        │
│ • pdfProcessor: Text extraction, 1200-char chunking, page num   │
│ • Vector Relevance Engine: Term frequency & Cosine scoring      │
│ • Synthesizer Engine: Gemini 1.5 Flash (or Local Structured)    │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database (MongoDB Atlas)                   │
├─────────────────────────────────────────────────────────────────┤
│ • Resource Collection (Metadata: title, subject, sem, branch)   │
│ • Embedded Chunks Array ([chunkIndex, text, charOffset, page])  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features Implemented

### 1. 🔍 AI Vector & Reference Search across Resource Vault
- **Real-Time Passage Matching:** Searches text passages across all uploaded PDF documents.
- **Relevance Scoring:** Computes hybrid similarity scores (e.g. `99% match`) based on term frequency, key concepts, and phrase proximity.
- **Pagination:** Displays 4 passage cards per page with `Previous` and `Next` controls.
- **Clean Citation Cards:** Displays document title, subject, semester, page badge (e.g. `Page 2`), and match score without clutter.

### 2. 🤖 Dedicated Document AI Chatbot ("Chat with PDF")
- **Route:** `/hub/vault/chat/:resourceId`
- **Document Header:** Shows document details, page count, and chunk stats.
- **Document-Scoped RAG:** Searches text chunks *strictly belonging to the selected document*.
- **Interactive Chat Interface:** Displays user and AI message bubbles with real-time response generation.
- **Interactive Page Citations:** Clickable source badges (`📍 Page 2`, `📍 Page 4`) that open a preview drawer showing exact text snippets.
- **Quick Prompts:** One-click prompt shortcuts ("Summarize document", "Key definitions", "Practice exam questions").

### 3. 📝 Dual-Engine Synthesis (100% Free Guarantee)
- **Engine A (Google Gemini 1.5 Flash API):** When `GEMINI_API_KEY` is present in `backend/.env`, calls Gemini API (Free Tier) to generate a bulleted AI answer.
- **Engine B (Local Structured Synthesizer):** When no API key is provided, a built-in rule-based engine categorizes extracted text into clean markdown headings (`Summary & Analysis`, `Key Work Completed`, `Upcoming Tasks / Plans`, `References & Links`).

### 4. 🎨 Custom Frontend Markdown Renderer (`FormattedMarkdownText.jsx`)
- Parses markdown syntax (`###`, `####`, `**bold**`, `• bullets`, `urls`) and renders styled HTML headings, bold text, bullet lists, and clickable hyperlinks.

### 5. 🛡️ Strict File Validation & Permissions
- **File Restrictions:** Restricts resource uploads strictly to `.pdf` files up to **15MB**.
- **Owner & Admin Rights:** Resource uploaders and administrators can edit and delete uploaded study materials.
- **Sanitized PDF Downloads:** Downloads route through backend endpoint `/api/hub/resources/download/:id` to deliver clean file headers and filenames (e.g. `Software_Testing.pdf`).

---

## System Design Choices & Trade-offs

| Design Decision | Choice Made | Why This Choice Was Made | Trade-offs & Future Scale |
| :--- | :--- | :--- | :--- |
| **Chunk Storage Location** | **Embedded MongoDB Array** (`resource.chunks`) | 100% free, zero third-party DB setup, single database consistency, ultra-fast (<30ms) for up to 5,000 PDFs. | At 10,000+ PDFs, offloading to Pinecone or MongoDB Atlas Vector Search Index is recommended. |
| **Chunking Parameters** | **1,200 characters** with **150-char overlap** | Preserves complete paragraphs, bullet lists, and page sections together in a single chunk. | Slightly larger chunk payload (~1.2 KB), but yields far superior answer quality. |
| **LLM Dependency** | **Dual Mode (Gemini API + Local Synthesizer)** | Guarantees 100% uptime with zero mandatory API key setup or external paid dependencies. | Local mode uses rule-based text extraction rather than generative AI reasoning. |
| **Document Search Scope** | **Scoped Document Search (`/vault/chat/:id`)** | Loads only 1 document (~15 KB payload) from MongoDB instead of scanning entire DB. | Keeps database memory usage near zero during active chat sessions. |
| **File Format Restriction** | **Strict PDF Only (.pdf, 15MB limit)** | Standardizes text extraction quality across all notes, manuals, and exam papers. | Non-PDF files (images/Word docs) must be converted to PDF prior to upload. |

---

## Capacity, Scale & Performance Analysis

### Database Storage Overhead
- **1 Text Chunk:** ~1.2 KB
- **10-Page PDF Document:** ~12 to 14 KB (10–12 chunks)
- **1,000 PDF Documents:** ~14 MB total MongoDB storage

### Scalability Roadmap

```
[0 - 1,000 PDFs]      ──> Current MongoDB Embedded Setup (<30ms query time, 100% Free)
[1,000 - 5,000 PDFs]  ──> MongoDB Atlas Free Tier (Takes ~70 MB storage, Fits comfortably)
[10,000+ PDFs]        ──> Connect Free Pinecone DB / Atlas Vector Search Index
```

---

## API Reference Documentation

### Resource Vault Routes (`/api/hub/resources`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/hub/resources` | Protected | Fetch resources filtered by semester & branch |
| `POST` | `/api/hub/resources` | Protected | Upload new PDF resource (max 15MB) & trigger background chunking |
| `POST` | `/api/hub/resources/search-ai` | Protected | Perform vector passage search & synthesis across all vault PDFs |
| `POST` | `/api/hub/resources/:id/chat` | Protected | Document-scoped AI Chat ("Chat with PDF") |
| `GET` | `/api/hub/resources/download/:id` | Public | Download PDF resource with sanitized title & `.pdf` filename |
| `PUT` | `/api/hub/resources/:id` | Owner / Admin | Update resource metadata or replace file |
| `DELETE` | `/api/hub/resources/:id` | Owner / Admin | Delete resource document, embedded chunks, and Cloudinary PDF file |
| `POST` | `/api/hub/resources/reindex` | Admin | Reindex all unindexed PDF resources |
