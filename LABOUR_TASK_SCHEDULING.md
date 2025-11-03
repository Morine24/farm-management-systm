# Labour Task Scheduling & Cost Management

## Overview
The Farm Management System now includes comprehensive labour task scheduling and cost tracking features that integrate task management with labour costs, enabling better resource planning and budget control.

## Features

### 1. Task-Based Labour Cost Tracking
- **Estimated Labour Costs**: When creating tasks, specify estimated hours and hourly rate
- **Automatic Cost Calculation**: System automatically calculates labour costs (hours × rate)
- **Actual Cost Recording**: Track actual hours and costs when completing tasks
- **Cost Variance Analysis**: Compare estimated vs actual costs to identify budget overruns

### 2. Labour Scheduler Dashboard
- **Weekly View**: View all scheduled tasks and labour assignments by week
- **Worker Schedule**: See each worker's assigned tasks and total hours/costs
- **Cost Summary**: Real-time tracking of estimated vs actual labour costs
- **Task Status Tracking**: Monitor completion rates and pending tasks

### 3. Enhanced Task Management
- **Labour Assignment**: Assign workers to tasks with hourly rates
- **Cost Estimation**: Calculate labour costs before task execution
- **Completion Tracking**: Record actual hours and costs upon task completion
- **Budget Variance**: Automatic calculation of over/under budget amounts

### 4. Worker Management Integration
- **Worker Database**: Maintain list of permanent and casual workers
- **Rate Management**: Store hourly rates for each worker
- **Attendance Tracking**: Check-in/check-out system for time tracking
- **Labour Records**: Historical record of all labour activities

## How to Use

### Creating a Task with Labour Costs

1. Navigate to **Tasks** page
2. Click **Add Task** button
3. Fill in task details:
   - Farm/Field
   - Task Type (plowing, sowing, irrigating, etc.)
   - Assigned To (user)
   - Due Date
   - Priority
   - **Estimated Hours** (new field)
   - **Hourly Rate** (new field)
4. System automatically calculates estimated labour cost
5. Click **Add Task**

### Completing a Task with Actual Costs

1. Navigate to **Tasks** page
2. Find task in progress
3. Click **Complete** button
4. Modal appears requesting:
   - **Actual Hours Worked**
   - **Actual Labour Cost**
5. System shows variance (over/under budget)
6. Click **Complete Task**

### Using Labour Scheduler

1. Navigate to **Labour Scheduler** page
2. View current week's scheduled tasks
3. Use **Previous Week** / **Next Week** buttons to navigate
4. Review:
   - Total scheduled tasks
   - Estimated hours and costs
   - Actual costs for completed tasks
   - Worker schedules and assignments
   - Cost variance analysis

### Managing Workers

1. Navigate to **Labour** page
2. Click **Add Worker** button
3. Enter worker details:
   - Name
   - Type (Permanent/Casual)
   - Rate per Hour
   - Phone (optional)
4. Workers are now available for task assignment

### Tracking Attendance

1. Navigate to **Labour** page
2. Click **Check In/Out** button
3. Select worker and field (optional)
4. Click **Check In**
5. When work is complete, click **Check Out**
6. System automatically calculates hours worked

## API Endpoints

### Tasks with Labour Costs

#### Create Task with Labour Cost
```
POST /api/tasks
Body: {
  farmId, farmName, type, assignedTo, dueDate, priority,
  estimatedHours, hourlyRate
}
```

#### Update Task Status with Actual Costs
```
PUT /api/tasks/:id/status
Body: {
  status: "completed",
  actualHours, actualCost
}
```

#### Assign Labour to Task
```
POST /api/tasks/:id/assign-labour
Body: {
  workerId, workerName, estimatedHours, hourlyRate
}
```

#### Get Task Cost Summary
```
GET /api/tasks/cost-summary
Response: {
  totalEstimatedCost, totalActualCost,
  totalEstimatedHours, totalActualHours,
  completedTasks, pendingTasks
}
```

### Labour Management

#### Get All Workers
```
GET /api/labour/workers
```

#### Add Worker
```
POST /api/labour/workers
Body: { name, type, ratePerHour, phone }
```

#### Check-in Worker
```
POST /api/labour/checkin
Body: { workerId, workerName, workerType, fieldId, fieldName }
```

#### Check-out Worker
```
PUT /api/labour/checkout/:attendanceId
```

## Database Schema

### Tasks Collection (Enhanced)
```javascript
{
  id: string,
  farmId: string,
  farmName: string,
  type: string,
  assignedTo: string,
  dueDate: Date,
  status: string,
  priority: string,
  estimatedHours: number,      // NEW
  hourlyRate: number,           // NEW
  labourCost: number,           // NEW (estimated)
  actualHours: number,          // NEW
  actualCost: number,           // NEW
  assignedWorker: string,       // NEW
  assignedWorkerName: string,   // NEW
  createdAt: Date,
  completedDate: Date
}
```

### Workers Collection
```javascript
{
  id: string,
  name: string,
  type: 'permanent' | 'casual',
  ratePerHour: number,
  phone: string,
  createdAt: Date
}
```

### Attendance Collection
```javascript
{
  id: string,
  workerId: string,
  workerName: string,
  workerType: string,
  fieldId: string,
  fieldName: string,
  checkInTime: Date,
  checkOutTime: Date,
  hoursWorked: number,
  status: 'checked_in' | 'checked_out'
}
```

## Benefits

1. **Better Budget Control**: Track estimated vs actual labour costs
2. **Resource Planning**: Schedule workers efficiently across tasks
3. **Cost Transparency**: Clear visibility of labour expenses
4. **Performance Tracking**: Monitor task completion rates and efficiency
5. **Financial Integration**: Labour costs automatically feed into financial reports
6. **Historical Data**: Build database of labour costs for future planning

## Reports & Analytics

### Labour Scheduler Dashboard Shows:
- Weekly scheduled tasks count
- Total estimated hours
- Total estimated cost
- Total actual cost
- Worker utilization
- Cost variance (over/under budget)
- Task completion rate

### Cost Analysis Includes:
- Estimated vs Actual hours comparison
- Estimated vs Actual cost comparison
- Budget variance calculation
- Task status breakdown
- Completion rate percentage

## Best Practices

1. **Accurate Estimates**: Use historical data to improve hour/cost estimates
2. **Regular Updates**: Update actual hours/costs promptly upon task completion
3. **Worker Rates**: Keep worker hourly rates up to date
4. **Weekly Reviews**: Review labour scheduler weekly for planning
5. **Variance Analysis**: Investigate significant cost variances
6. **Attendance Tracking**: Use check-in/out for accurate time tracking

## Future Enhancements

- Automated worker assignment based on availability
- Labour cost forecasting using historical data
- Mobile app for field workers to track time
- Integration with payroll systems
- Advanced analytics and reporting
- Worker performance metrics
- Skill-based task assignment

## Support

For issues or questions about labour task scheduling and cost management, please refer to the main README.md or contact the development team.
