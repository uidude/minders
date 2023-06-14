import {APP_CONFIG, FIREBASE_CONFIG} from '@app/common/Config';
import {FirestoreDatastore} from '@toolkit/providers/firebase/DataStore';
import {initFirebaseServer} from '@toolkit/providers/firebase/server/Config';
import {
  AuthenticateMiddleware,
  RolesCheckMiddleware,
  initMiddlewares,
  providersMiddleware,
} from '@toolkit/providers/firebase/server/Handler';

initFirebaseServer(FIREBASE_CONFIG, APP_CONFIG);

const providers = [FirestoreDatastore, APP_CONFIG];

initMiddlewares([
  providersMiddleware(providers),
  AuthenticateMiddleware,
  RolesCheckMiddleware,
]);

exports.minders = require('./handlers');
