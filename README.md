# ConvertPro 🚀

A premium, modern, responsive, and secure full-stack file conversion application built with React and Node.js.

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn

## Features
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion (animations)
- **Backend**: Node.js + Express + Multer
- **Conversions Supported**: PNG to JPG, JPG to PNG, PDF to Text, Text to PDF, Merge PDF, Split PDF. (Office to PDF endpoints are prepared as secure placeholders).
- **Secure**: Auto-deletion of files after 30 minutes from the server via built-in scheduler.

## Installation & Setup

### 1. Start the Backend Server
```bash
cd backend
npm install
node server.js
```
*The backend will run on http://localhost:5000*

### 2. Start the Frontend Client
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on http://localhost:5173*

## Deployment
- **Frontend** can be easily deployed to Vercel or Netlify.
- **Backend** can be deployed to Render, Railway, or a VPS. (For proper Office document conversions, ensure the deployment server has LibreOffice installed or integrate an API).
