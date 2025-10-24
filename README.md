# Farm Management System

A comprehensive farm management system with separate frontend and backend applications.

## Project Structure

```
loosians/
├── farm-management-frontend/    # React TypeScript frontend
├── farm-management-backend/     # Node.js Express backend
└── README.md                   # This file
```

## Quick Start

### Backend Setup
```bash
cd farm-management-backend
npm install
cp .env.example .env
# Configure your Firebase credentials and API keys
npm run dev
```

### Frontend Setup
```bash
cd farm-management-frontend
npm install
npm start
```

## Applications

### 🌐 Frontend (React)
- **Port**: http://localhost:3000
- **Technology**: React 18 + TypeScript + Tailwind CSS
- **Features**: Dashboard, Field Management, Crop Tracking, Task Management, Inventory, Financial Analytics, Weather Monitoring

### 🔧 Backend (Node.js)
- **Port**: http://localhost:5000
- **Technology**: Node.js + Express + Firebase Firestore
- **Features**: RESTful API, Real-time updates, Weather integration, Authentication

## Features

- **Dashboard**: Real-time statistics and data visualization
- **Field Management**: Interactive maps with soil health monitoring
- **Crop Management**: Growth tracking and harvest scheduling
- **Task Management**: Assignment and progress tracking with notifications
- **Inventory Management**: Stock monitoring with low-stock alerts
- **Financial Management**: Income/expense tracking with analytics
- **Weather Monitoring**: Real-time weather data and farming recommendations
- **Mobile-First Design**: Optimized for smartphones and tablets

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Recharts for data visualization
- React Leaflet for interactive maps
- Firebase for authentication
- Socket.io for real-time updates

### Backend
- Node.js with Express
- Firebase Firestore database
- Socket.io for real-time communication
- Weather API integration
- CORS enabled for frontend communication

## Development

1. **Start Backend**:
   ```bash
   cd farm-management-backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd farm-management-frontend
   npm start
   ```

3. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Deployment

Each application can be deployed independently:

- **Frontend**: Deploy to Vercel, Netlify, or any static hosting
- **Backend**: Deploy to Heroku, Railway, or any Node.js hosting

## License

MIT License - see individual project directories for details.