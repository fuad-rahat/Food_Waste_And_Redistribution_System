# Food Waste & Redistribution System

A full-stack MERN application designed to bridge the gap between food providers (restaurants, hotels, etc.) and NGOs to minimize food waste and redistribute surplus food to those in need.

## 🚀 Features

- **Provider Dashboard**: Manage surplus food listings, track NGO requests, and confirm distributions.
- **NGO Dashboard**: Discover nearby food using geolocation, request items, and provide distribution proofs.
- **Interactive Discovery**: A dedicated "Explore Food" page for real-time browsing of available listings.
- **Role-Based Access**: Secure authentication for Admins, Providers, and NGOs.
- **Proximity Search**: Find food within a specific radius using browser location services.
- **Notification System**: Real-time alerts for request status updates.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Axios, React Leaflet (Maps).
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT Authentication.
- **Image Hosting**: ImgBB API for certificate and proof uploads.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16.x or higher)
- [npm](https://www.npmjs.com/) (v8.x or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or local MongoDB instance.

## 🚀 Live Deployment

The system is now live at:
- **Frontend**: [https://foodsharebd.vercel.app](https://foodsharebd.vercel.app)
- **Backend API**: [https://foodrescuebd-backend.vercel.app](https://foodrescuebd-backend.vercel.app)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/fuad-rahat/Food_Waste_And_Redistribution_System.git
cd Food_Waste_And_Redistribution_System
```

### 2. Backend Setup
Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 3. Frontend Setup
Navigate to the `frontend` directory and install dependencies:
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```bash
VITE_API_BASE_URL=https://foodrescuebd-backend.vercel.app
VITE_IMGBB_API_KEY=your_imgbb_api_key
```

## 🏃‍♂️ Running the Application

### Local Development
- Start the backend: `npm run dev` in the `/backend` directory.
- Start the frontend: `npm run dev` in the `/frontend` directory.

### Production Execution
The application uses **Vercel** for serverless deployment.
- Frontend sub-routes are handled by `frontend/vercel.json`.
- Backend API routes are routed to `server.js` via `backend/vercel.json`.

## 📂 Project Structure

- `/backend`: Express server, MongoDB models, JWT middleware, and API routes.
- `/frontend`: React frontend with Tailwind CSS, context-based state management, and custom UI components.

## 📜 License
This project is licensed under the MIT License.
