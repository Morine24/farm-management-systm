# Farm Management System - Backend

Node.js backend API for the comprehensive farm management system.

## Features

- **RESTful API** for all farm management operations
- **Firebase Firestore** integration for data persistence
- **Real-time updates** via Socket.io
- **Weather API** integration
- **Authentication** ready with Firebase Auth
- **CORS** enabled for frontend communication

## Technology Stack

- **Node.js** with Express.js
- **Firebase Admin SDK** for Firestore operations
- **Socket.io** for real-time communication
- **Axios** for external API calls
- **CORS** for cross-origin requests

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with:
   - Firebase service account key path
   - Weather API key (OpenWeatherMap)
   - Other configuration values

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Start production server**:
   ```bash
   npm start
   ```

## Environment Variables

```env
GOOGLE_APPLICATION_CREDENTIALS=path/to/firebase-service-account-key.json
WEATHER_API_KEY=your_openweathermap_api_key
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Fields
- `GET /api/fields` - Get all fields
- `POST /api/fields` - Create new field
- `PUT /api/fields/:id` - Update field
- `PUT /api/fields/:id/soil-health` - Update soil health

### Crops
- `GET /api/crops` - Get all crops
- `POST /api/crops` - Create new crop
- `PUT /api/crops/:id` - Update crop
- `GET /api/crops/yield-history` - Get yield history

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id/status` - Update task status
- `GET /api/tasks/overdue` - Get overdue tasks

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new item
- `PUT /api/inventory/:id/quantity` - Update quantity
- `GET /api/inventory/low-stock` - Get low stock items

### Financial
- `GET /api/financial` - Get financial records
- `POST /api/financial` - Create new record
- `GET /api/financial/summary` - Get financial summary

### Weather
- `GET /api/weather/current` - Get current weather
- `GET /api/weather/forecast` - Get weather forecast

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

## Firebase Collections

The API uses the following Firestore collections:
- `fields` - Field management data
- `crops` - Crop tracking information
- `tasks` - Task assignments and status
- `inventory` - Inventory items and stock levels
- `financial` - Financial records and transactions

## Real-time Features

Socket.io events:
- `new_task` - New task created
- `task_updated` - Task status updated
- `low_stock_alert` - Inventory low stock alert

## Development

- Uses `nodemon` for auto-restart during development
- CORS configured for `http://localhost:3000` (frontend)
- Error handling and validation included