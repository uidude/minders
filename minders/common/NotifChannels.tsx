import NotificationChannel from '@toolkit/services/notifications/NotificationChannel';

export const NOTIF_CHANNELS: Record<string, NotificationChannel> = {
  thingFaved: new NotificationChannel({
    id: 'minders:reminder',
    name: 'Minder reminders',
    description: 'Reminders for upcoming Minders',
    titleFormat: '${title}',
    bodyFormat: '${body}',
    defaultDeliveryMethod: 'PUSH',
  }),

  admin: new NotificationChannel({
    id: 'minders:admin',
    name: 'System notifications',
    description: 'Notifications from the app',
    titleFormat: '${title}',
    bodyFormat: '${body}',
    defaultDeliveryMethod: 'PUSH',
  }),
};
