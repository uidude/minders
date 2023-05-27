import {serverApi} from '@toolkit/core/api/DataApi';
import {User} from '@toolkit/core/api/User';
import {Updater} from '@toolkit/data/DataStore';
import {PushToken} from '@toolkit/services/notifications/NotificationTypes';
import {LoginUserInfo, useGetOrCreateUser} from './AppLogic';

export const GetUser = serverApi<LoginUserInfo, User>(
  'getUser',
  useGetOrCreateUser,
);

export const UpdateUser = serverApi<Updater<User>, User>('updateUser');

export type ID = string;

// Admin panel
type AdminNotifReq = {user: User; title?: string; body: string};
export const SendAdminNotif = serverApi<AdminNotifReq, void>('sendAdminNotif');
type BroadcastReq = {title?: string; body: string};
export const BroadcastNotif = serverApi<BroadcastReq, void>('broadcastNotif');

// Data export tools

export type ExportResp = {name: string; url: string};
/**
 * Manually trigger the export handler.
 * TODO: Expose with role-based access in admin console.
 */
export const AdminExportTrigger = serverApi<void, any>('adminExportTrigger');

// Export job handler, triggered by the cron process
export const ExportJob = serverApi<void, ExportResp>('exportJob');

/** Dev API to send yourself a test notification. */
export const TestNotif = serverApi<PushToken, void>('testNotif');
