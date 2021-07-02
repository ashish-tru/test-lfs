export enum NotificationKeys {
  ADD_NOTIFICATION = 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION',
}

export interface NotificationType {
  type: string;
  payload: NotificationContentType;
}

export interface NotificationContentType {
  id: string;
  message: string;
  type: string;
  title?: string;
  autoRemove?: boolean;
}

export function showNotification(payload: NotificationContentType) {
  return {
    type: NotificationKeys.ADD_NOTIFICATION,
    payload,
  };
}

export function removeNotification(payload: string) {
  return {
    type: NotificationKeys.REMOVE_NOTIFICATION,
    payload,
  };
}

export default { showNotification, removeNotification };
