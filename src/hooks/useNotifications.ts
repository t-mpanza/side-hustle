import { useEffect, useCallback } from 'react';
import { NotificationService, StockItem } from '../services/notificationService';

export const useNotifications = () => {
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Initialize notifications when the hook is used
    notificationService.initialize();
  }, []);

  const checkLowStock = useCallback(async (items: StockItem[]) => {
    await notificationService.checkLowStock(items);
  }, []);

  const setStockThreshold = useCallback((itemName: string, threshold: number) => {
    notificationService.setStockThreshold(itemName, threshold);
  }, []);

  const getStockThreshold = useCallback((itemName: string) => {
    return notificationService.getStockThreshold(itemName);
  }, []);

  return {
    checkLowStock,
    setStockThreshold,
    getStockThreshold
  };
};
