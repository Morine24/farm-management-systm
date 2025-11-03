# Notification System

## Overview
The Farm Management System includes a real-time notification system that alerts users about important events and actions.

## Features Implemented

### ✅ Backend
- **Notifications API** (`/api/notifications`)
  - GET `/` - Fetch all notifications
  - POST `/` - Create new notification
  - PUT `/:id/read` - Mark as read
  - PUT `/read-all` - Mark all as read
- **Real-time delivery** via Socket.IO
- **Auto-notifications** for:
  - New task assignments
  - Overdue tasks

### ✅ Frontend
- **Notification Center** component in top navigation
- **Unread badge** showing count
- **Browser notifications** for high-priority alerts
- **Real-time updates** via Firebase
- **Priority-based styling** (high/medium/low)

## Current Notification Types

| Type | Icon | Priority | Trigger |
|------|------|----------|---------|
| `task_assigned` | 📋 | Medium | New task created |
| `task_overdue` | ⏰ | High | Task past due date |
| `task_completed` | ✅ | Low | Task marked complete |
| `low_inventory` | 📦 | Medium | Stock below threshold |
| `payment_due` | 💰 | Medium | Payment pending >7 days |
| `weather_alert` | 🌡️ | High | Severe weather |
| `equipment_failure` | ⚠️ | High | Equipment broken |

## How to Add New Notifications

### Backend (in any route file):
```javascript
const { createNotification } = require('./notifications');

// Inside your route handler
await createNotification(db, io, {
  userId: 'all', // or specific userId
  type: 'low_inventory',
  title: 'Low Stock Alert',
  message: 'Fertilizer stock is running low',
  priority: 'medium', // 'low', 'medium', 'high'
  data: { itemId: '123', quantity: 5 }
});
```

### Example Implementations:

#### 1. Low Inventory Alert
```javascript
// In inventory.js route
if (item.quantity < item.minThreshold) {
  await createNotification(db, io, {
    userId: 'all',
    type: 'low_inventory',
    title: 'Low Stock Alert',
    message: `${item.name} stock is low (${item.quantity} remaining)`,
    priority: 'medium',
    data: { itemId: item.id }
  });
}
```

#### 2. Payment Due Alert
```javascript
// In labour.js route
const pendingPayments = records.filter(r => 
  r.status === 'pending' && 
  daysSince(r.date) > 7
);

for (const payment of pendingPayments) {
  await createNotification(db, io, {
    userId: 'all',
    type: 'payment_due',
    title: 'Payment Overdue',
    message: `Payment to ${payment.workerName} is overdue`,
    priority: 'high',
    data: { recordId: payment.id }
  });
}
```

#### 3. Equipment Failure
```javascript
// When updating drip line status
if (status === 'broken') {
  await createNotification(db, io, {
    userId: 'all',
    type: 'equipment_failure',
    title: 'Equipment Failure',
    message: `${dripline.name} is broken and needs repair`,
    priority: 'high',
    data: { driplineId: dripline.id }
  });
}
```

## Browser Notifications

The system requests browser notification permission on first load. High-priority notifications will show as browser notifications if permission is granted.

## Future Enhancements

### Phase 2:
- [ ] User-specific notifications
- [ ] Notification preferences/settings
- [ ] Email notifications
- [ ] SMS notifications (via Twilio)
- [ ] Scheduled notifications (daily summaries)
- [ ] Notification history page

### Phase 3:
- [ ] Push notifications (PWA)
- [ ] Notification categories/filters
- [ ] Snooze functionality
- [ ] Action buttons in notifications
- [ ] Notification templates
- [ ] Multi-language support

## Testing

1. **Create a task** → Should see "New Task Assigned" notification
2. **Check overdue tasks** → Should see "Task Overdue" notifications
3. **Click notification** → Should mark as read
4. **Click bell icon** → Should open notification panel

## Database Schema

```javascript
{
  id: string,
  userId: string, // 'all' for broadcast
  type: string,
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high',
  read: boolean,
  data: object, // Additional context
  createdAt: Date
}
```

## API Endpoints

### Get Notifications
```
GET /api/notifications?userId=all
Response: [{ id, type, title, message, priority, read, createdAt, data }]
```

### Create Notification
```
POST /api/notifications
Body: { userId, type, title, message, priority, data }
Response: { id, ...notification }
```

### Mark as Read
```
PUT /api/notifications/:id/read
Response: { message: 'Notification marked as read' }
```

### Mark All as Read
```
PUT /api/notifications/read-all
Body: { userId }
Response: { message: 'All notifications marked as read' }
```

## Support

For questions about the notification system, refer to the main README.md or contact the development team.
