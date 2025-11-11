import { collection, addDoc, onSnapshot, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

class SmartAlertService {
  private unsubscribers: (() => void)[] = [];
  private notifiedItems: Set<string> = new Set();

  async createNotification(notification: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    type: string;
    data?: any;
  }) {
    const notificationKey = `${notification.type}_${notification.data?.cropId || notification.data?.itemId || notification.data?.taskId || notification.data?.farmId || ''}_${notification.message}`;
    
    if (this.notifiedItems.has(notificationKey)) {
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        read: false,
        createdAt: new Date()
      });

      this.notifiedItems.add(notificationKey);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/loosian-logo.jpg',
          badge: '/loosian-logo.jpg',
          tag: notification.type
        });
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  monitorCrops() {
    const unsubscribe = onSnapshot(collection(db, 'crops'), async (snapshot) => {
      snapshot.docs.forEach(async (cropDoc) => {
        const crop: any = { id: cropDoc.id, ...cropDoc.data() };
        const plantedDate = crop.plantedDate?.toDate?.() || new Date(crop.plantedDate);
        const daysGrown = Math.floor((Date.now() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
        const expectedHarvestDays = crop.expectedHarvestDays || 90;

        // Auto-update status: planted → growing (after 3 days)
        if (crop.status === 'planted' && daysGrown >= 3) {
          await updateDoc(doc(db, 'crops', crop.id), { status: 'growing' });
          this.createNotification({
            title: '🌱 Crop Status Updated',
            message: `${crop.name || crop.cropType} is now growing (${daysGrown} days old)`,
            priority: 'low',
            type: 'crop_status_update',
            data: { cropId: crop.id }
          });
        }

        // Auto-update status: growing → harvested (when harvest date reached)
        if ((crop.status === 'growing' || crop.status === 'active') && daysGrown >= expectedHarvestDays) {
          await updateDoc(doc(db, 'crops', crop.id), { status: 'harvested', harvestDate: new Date() });
          this.createNotification({
            title: '🌾 Crop Ready for Harvest',
            message: `${crop.name || crop.cropType} has reached harvest maturity (${daysGrown} days)`,
            priority: 'high',
            type: 'crop_harvested',
            data: { cropId: crop.id }
          });
        }

        if (crop.status === 'growing' || crop.status === 'active') {
          if (daysGrown >= 7 && daysGrown % 3 === 0) {
            this.createNotification({
              title: '💧 Irrigation Required',
              message: `${crop.name || crop.cropType} needs watering. Days since planting: ${daysGrown}`,
              priority: 'high',
              type: 'irrigation_required',
              data: { cropId: crop.id }
            });
          }

          if (daysGrown === 14 || daysGrown === 28 || daysGrown === 42) {
            this.createNotification({
              title: '🌿 Weeding Required',
              message: `${crop.name || crop.cropType} requires weeding at ${daysGrown} days growth`,
              priority: 'high',
              type: 'weeding_required',
              data: { cropId: crop.id }
            });
          }

          if (daysGrown === 21 || daysGrown === 45) {
            this.createNotification({
              title: '🌱 Fertilization Due',
              message: `${crop.name || crop.cropType} needs fertilization`,
              priority: 'medium',
              type: 'fertilization_required',
              data: { cropId: crop.id }
            });
          }

          if (daysGrown >= expectedHarvestDays - 7 && daysGrown < expectedHarvestDays) {
            this.createNotification({
              title: '🌾 Harvest Approaching',
              message: `${crop.name || crop.cropType} ready in ${expectedHarvestDays - daysGrown} days`,
              priority: 'medium',
              type: 'harvest_approaching',
              data: { cropId: crop.id }
            });
          }
        }
      });
    });
    this.unsubscribers.push(unsubscribe);
  }

  monitorInventory() {
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      snapshot.docs.forEach(doc => {
        const item: any = { id: doc.id, ...doc.data() };
        const threshold = item.minQuantity || 10;

        if (item.quantity <= threshold && item.quantity > 0) {
          this.createNotification({
            title: '📦 Low Stock Alert',
            message: `${item.name} is running low (${item.quantity} ${item.unit} remaining)`,
            priority: 'medium',
            type: 'low_inventory',
            data: { itemId: item.id }
          });
        } else if (item.quantity === 0) {
          this.createNotification({
            title: '⚠️ Out of Stock',
            message: `${item.name} is out of stock. Reorder immediately!`,
            priority: 'high',
            type: 'out_of_stock',
            data: { itemId: item.id }
          });
        }
      });
    });
    this.unsubscribers.push(unsubscribe);
  }

  monitorTasks() {
    const unsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const now = new Date();
      snapshot.docs.forEach(doc => {
        const task: any = { id: doc.id, ...doc.data() };
        const dueDate = task.dueDate?.toDate?.() || new Date(task.dueDate);

        if (task.status !== 'completed' && dueDate < now) {
          this.createNotification({
            title: '⏰ Task Overdue',
            message: `"${task.title}" is overdue. Assigned to: ${task.assignedTo || 'Unassigned'}`,
            priority: 'high',
            type: 'task_overdue',
            data: { taskId: task.id }
          });
        } else if (task.status !== 'completed') {
          const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
            this.createNotification({
              title: '⏳ Task Due Soon',
              message: `"${task.title}" is due in ${Math.round(hoursUntilDue)} hours`,
              priority: 'medium',
              type: 'task_due_soon',
              data: { taskId: task.id }
            });
          }
        }
      });
    });
    this.unsubscribers.push(unsubscribe);
  }

  monitorSoilHealth() {
    const unsubscribe = onSnapshot(collection(db, 'farms'), (snapshot) => {
      snapshot.docs.forEach(doc => {
        const farm: any = { id: doc.id, ...doc.data() };
        const soilHealth = farm.soilHealth;

        if (soilHealth) {
          if (soilHealth.ph < 5.5 || soilHealth.ph > 8.0) {
            this.createNotification({
              title: '⚠️ Soil pH Alert',
              message: `${farm.name}: pH ${soilHealth.ph} outside optimal range (5.5-8.0)`,
              priority: 'high',
              type: 'soil_ph_alert',
              data: { farmId: farm.id }
            });
          }

          if (soilHealth.moisture < 30) {
            this.createNotification({
              title: '💧 Low Soil Moisture',
              message: `${farm.name}: Moisture at ${soilHealth.moisture}%. Irrigation recommended.`,
              priority: 'high',
              type: 'low_moisture',
              data: { farmId: farm.id }
            });
          }
        }
      });
    });
    this.unsubscribers.push(unsubscribe);
  }

  async monitorFinancials() {
    const snapshot = await getDocs(collection(db, 'financial'));
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    const currentMonth = new Date().getMonth();
    
    const monthlyExpenses = records
      .filter((r: any) => r.type === 'expense' && new Date(r.date?.toDate?.() || r.date).getMonth() === currentMonth)
      .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

    const monthlyIncome = records
      .filter((r: any) => r.type === 'income' && new Date(r.date?.toDate?.() || r.date).getMonth() === currentMonth)
      .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

    if (monthlyExpenses > monthlyIncome) {
      this.createNotification({
        title: '📉 Negative Cash Flow',
        message: `Expenses exceed income by KSh ${(monthlyExpenses - monthlyIncome).toLocaleString()}`,
        priority: 'high',
        type: 'negative_cashflow'
      });
    }
  }

  startMonitoring() {
    this.monitorCrops();
    this.monitorInventory();
    this.monitorTasks();
    this.monitorSoilHealth();
    this.monitorFinancials();
    setInterval(() => this.monitorFinancials(), 60 * 60 * 1000);
  }

  stopMonitoring() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
    this.notifiedItems.clear();
  }
}

export const smartAlertService = new SmartAlertService();
