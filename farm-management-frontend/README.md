# Farm Management System - Frontend

React-based frontend application for the comprehensive farm management system.

## Features

- **Dashboard**: Real-time statistics and data visualization
- **Field Management**: Interactive maps and field monitoring
- **Crop Management**: Growth tracking and harvest scheduling
- **Task Management**: Assignment and progress tracking
- **Inventory Management**: Stock monitoring with alerts
- **Financial Management**: Income/expense tracking and analytics
- **Weather Monitoring**: Real-time weather data and recommendations

## Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Recharts** for data visualization
- **React Leaflet** for interactive maps
- **Firebase** for authentication and real-time data
- **Lucide React** for icons

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   - Update `src/config/firebase.ts` with your Firebase configuration
   - Ensure Firestore and Authentication are enabled

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Environment Setup

The frontend connects to the backend API at `http://localhost:5000` by default. Update the proxy in `package.json` if your backend runs on a different port.

## Project Structure

```
src/
├── components/         # Reusable UI components
├── pages/             # Main application pages
├── config/            # Firebase configuration
└── utils/             # Utility functions
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## API Integration

The frontend communicates with the backend through REST API endpoints:
- Dashboard statistics
- CRUD operations for all entities
- Real-time updates via Socket.io
- Weather data integration

## Mobile-First Design

The application is optimized for mobile devices with:
- Responsive layouts
- Touch-friendly interfaces
- Collapsible navigation
- Optimized performance