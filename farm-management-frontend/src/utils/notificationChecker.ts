import { generateMaintenanceSchedule } from './cropDatabase';

export interface MaintenanceNotification {
  id?: string;
  cropId?: string;
  cropVariety?: string;
  farmName?: string;
  taskType: string;
  taskDate: string;
  daysUntil: number;
  pesticides?: string[];
  assignedTo?: string;
  priority?: string;
  read?: boolean;
}

export const checkUpcomingTasks = (crops: any[]): MaintenanceNotification[] => {
  const notifications: MaintenanceNotification[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  crops.forEach(crop => {
    const schedule = generateMaintenanceSchedule(crop.plantingDate, crop.variety);
    
    schedule.forEach(task => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      
      const daysUntil = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Notify 1 day before and on the day
      if (daysUntil >= 0 && daysUntil <= 1) {
        notifications.push({
          cropId: crop.id,
          cropVariety: crop.variety,
          farmName: crop.farmName,
          taskType: task.type,
          taskDate: task.date,
          daysUntil,
          pesticides: task.pesticides
        });
      }
    });
  });
  
  return notifications.sort((a, b) => a.daysUntil - b.daysUntil);
};
