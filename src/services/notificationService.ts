import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface StockItem {
  name: string;
  currentStock: number;
  lowStockThreshold: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private stockThresholds: { [key: string]: number } = {
    'Energy Drinks': 5,
    'Pop Shots': 12,
    'Ice-Cream': 10
  };
  
  // Track notification history to prevent spam
  private notificationHistory: { [key: string]: { count: number; lastSent: string } } = {};

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Request notification permissions
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        console.log('Notification permissions granted');
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  }

  public async checkLowStock(items: StockItem[]): Promise<void> {
    const today = new Date().toDateString();
    
    for (const item of items) {
      const threshold = this.stockThresholds[item.name];
      
      if (threshold && item.currentStock <= threshold) {
        const itemKey = item.name;
        const history = this.notificationHistory[itemKey];
        
        // Check if we should send notification
        const shouldSend = this.shouldSendNotification(itemKey, today);
        
        if (shouldSend) {
          await this.sendLowStockNotification(item);
          
          // Update notification history
          this.notificationHistory[itemKey] = {
            count: history ? history.count + 1 : 1,
            lastSent: today
          };
        }
      }
    }
  }
  
  private shouldSendNotification(itemName: string, today: string): boolean {
    const history = this.notificationHistory[itemName];
    
    // If no history, send notification
    if (!history) return true;
    
    // If last sent was not today, reset count and send
    if (history.lastSent !== today) {
      return true;
    }
    
    // If sent today, only send if less than 2 times
    return history.count < 2;
  }

  private async sendLowStockNotification(item: StockItem): Promise<void> {
    try {
      const threshold = this.stockThresholds[item.name];
      const message = `⚠️ Low Stock Alert: ${item.name} is running low! Only ${item.currentStock} left (threshold: ${threshold})`;
      
      console.log(`Sending low stock notification for ${item.name}: ${message}`);
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Low Stock Alert',
            body: message,
            id: Date.now() + Math.random(), // Unique ID
            schedule: { at: new Date(Date.now() + 1000) }, // Show immediately
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              itemName: item.name,
              currentStock: item.currentStock,
              threshold: threshold
            }
          }
        ]
      });

      console.log(`✅ Low stock notification sent for ${item.name}`);
    } catch (error) {
      console.error('❌ Error sending low stock notification:', error);
    }
  }


  public setStockThreshold(itemName: string, threshold: number): void {
    this.stockThresholds[itemName] = threshold;
  }

  public getStockThreshold(itemName: string): number {
    return this.stockThresholds[itemName] || 0;
  }
}
