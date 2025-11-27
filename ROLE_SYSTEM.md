# Role-Based Access Control (RBAC) System

## Role Hierarchy

### 1. Super Admin
- **Access**: Full system access
- **Can**:
  - Manage all farms without restrictions
  - Create/edit/delete all users including Admins
  - View all financial data
  - Access all features
- **Cannot**: Nothing - has full access

### 2. Admin
- **Access**: Farm-level management
- **Can**:
  - Manage assigned farms only
  - Create/edit/delete Managers and Workers
  - Full access to farm structure
  - View and manage crops, tasks, inventory
  - Full financial access for assigned farms
  - View analytics
- **Cannot**:
  - Access other admins' farms
  - Create other admins or super admins

### 3. Manager
- **Access**: Operational management
- **Can**:
  - View assigned farm structure (read-only)
  - Create/edit/delete crops
  - Create/assign/complete tasks
  - Manage inventory
  - Record expenses
  - Manage workers
  - View financial summaries
  - Generate reports
- **Cannot**:
  - Delete farms or sections
  - View detailed profit/loss
  - Manage other managers or admins

### 4. Worker
- **Access**: Task execution only
- **Can**:
  - View assigned tasks
  - Mark tasks as complete
  - View crops they're working on
  - View weather
- **Cannot**:
  - Create tasks
  - View financial data
  - Access farm structure
  - Manage inventory

## Feature Access Matrix

| Feature | Super Admin | Admin | Manager | Worker |
|---------|-------------|-------|---------|--------|
| Dashboard | ✅ Full | ✅ Full | ✅ Limited | ✅ Tasks Only |
| Farms | ✅ All | ✅ Assigned | ✅ View Only | ❌ |
| Sections/Blocks/Beds | ✅ Full | ✅ Full | ✅ View Only | ❌ |
| Crops | ✅ Full | ✅ Full | ✅ Full | ✅ View Assigned |
| Tasks | ✅ Full | ✅ Full | ✅ Create/Assign | ✅ View/Complete Own |
| Inventory | ✅ Full | ✅ Full | ✅ Manage | ❌ |
| Financial | ✅ Full | ✅ Full | ✅ Limited | ❌ |
| Labour | ✅ Full | ✅ Full | ✅ Manage | ❌ |
| Analytics | ✅ Full | ✅ Full | ✅ Basic | ❌ |
| Weather | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Staffing | ✅ Full | ✅ Manage Lower | ❌ | ❌ |
| Reports | ✅ Full | ✅ Full | ✅ Basic | ❌ |

## Implementation Details

### User Model
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'worker';
  phone: string;
  status: 'active' | 'inactive';
  assignedFarms?: string[]; // Only for admin and manager
  createdAt: Date;
}
```

### Context Helpers
```typescript
const { 
  user,              // Current user object
  isSuperAdmin,      // true if super_admin
  isAdmin,           // true if admin or super_admin
  isManager,         // true if manager, admin, or super_admin
  isWorker,          // true if worker
  canManageFarm,     // Function to check farm access
  canViewFinancials, // true if can view financial data
  canManageUsers     // true if can manage users
} = useUser();
```

### Usage Examples

#### Check if user can edit a farm
```typescript
if (canManageFarm(farmId)) {
  // Show edit button
}
```

#### Conditional rendering based on role
```typescript
{canManageUsers && (
  <Route path="/users" element={<Users />} />
)}
```

#### Filter farms by assignment
```typescript
const visibleFarms = isSuperAdmin 
  ? allFarms 
  : allFarms.filter(farm => canManageFarm(farm.id));
```

## Default Credentials

All new users are created with:
- **Password**: `Karibu@123`
- **Must change on first login**: Yes

## Farm Assignment

- **Super Admin**: Can access all farms automatically
- **Admin/Manager**: Must be assigned specific farms
- **Worker**: No farm assignment needed (sees only assigned tasks)

## Security Notes

1. Backend API should validate role permissions
2. Frontend checks are for UX only
3. Always verify user role on server side
4. Audit logs should track role changes
5. Password reset sets default password

## Migration Guide

### Updating Existing Users

Run this in Firebase Console or backend:

```javascript
// Update existing users to new role system
const users = await db.collection('users').get();
users.forEach(async (doc) => {
  const data = doc.data();
  let newRole = 'worker';
  
  if (data.role === 'admin') newRole = 'admin';
  else if (data.role === 'manager') newRole = 'manager';
  else if (data.role === 'financial_manager') newRole = 'manager';
  
  await doc.ref.update({ 
    role: newRole,
    assignedFarms: [] // Assign farms manually later
  });
});
```

### Creating First Super Admin

```javascript
await db.collection('users').add({
  name: 'System Administrator',
  email: 'admin@loosianfarm.com',
  role: 'super_admin',
  phone: '+254...',
  status: 'active',
  password: 'Karibu@123',
  isDefaultPassword: true,
  createdAt: new Date()
});
```

## Future Enhancements

1. **Permission-based system**: More granular control
2. **Multi-tenancy**: Separate organizations
3. **Role templates**: Predefined permission sets
4. **Audit logging**: Track all role changes
5. **Time-based access**: Temporary permissions
