/**
 * Library functionality that in future (after cleaning up / generalizing)
 * may make sense to move to the Toolkit
 */

import {ExportJob} from '@app/common/Api';
import {FIREBASE_CONFIG} from '@app/common/Config';
import {ApiKey, serverApi} from '@toolkit/core/api/DataApi';
import {CodedError} from '@toolkit/core/util/CodedError';
import {getFirebaseConfig} from '@toolkit/providers/firebase/Config';
import {requireRole} from '@toolkit/providers/firebase/server/Auth';
import {registerHandler} from '@toolkit/providers/firebase/server/Handler';
import firebase from 'firebase';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import 'firebase/functions';

export const exportJob = registerHandler(ExportJob, async () => {
  // TODO: How to
  requireRole('export');
  functions.logger.log('Running Exporter');
});

export const ExportTest = serverApi<void, void>('exportDataTest');

export const exportDataTest = registerHandler(ExportTest, async () => {
  functions.logger.log('Trying to call Exporter');

  const exportJob = await getFunction(ExportJob, 'export');
  try {
    const result = await exportJob();
    functions.logger.log('Result', result);
  } catch (e: any) {
    throw toThrownError(e);
  }
});

export function toThrownError(e: any) {
  const coded = e?.details?.CodedError;
  if (coded) {
    return new CodedError(
      coded.type,
      coded.userVisibleMessage,
      coded.devMessage,
    );
  } else {
    functions.logger.info('uncoded', e);
    return e;
  }
}

export async function getFunction<I, O>(key: ApiKey<I, O>, role?: string) {
  const app = await getApp(role);
  const clientFunctions = app.functions('us-central1');
  //clientFunctions.useEmulator('localhost', 5001);
  functions.logger.log('Calling...', `minders-${key.id}`);
  return clientFunctions.httpsCallable(`minders-${key.id}`);
}

const firebaseApps: Record<string, firebase.app.App> = {};

export async function getApp(role: string = 'default') {
  const appName = `role-${role}`;
  let app = firebaseApps[appName];
  if (!app) {
    app = firebaseApps[appName] = firebase.initializeApp(
      FIREBASE_CONFIG,
      appName,
    );
    if (role !== 'default') {
      const token = await admin
        .auth()
        .createCustomToken(appName, {roles: [role]});
      await app.auth().signInWithCustomToken(token);
      firebaseApps[appName] = app;
    }
  }
  return app;
}
