import {APP_CONFIG, FIREBASE_CONFIG} from '@app/common/Config';
import {FirestoreDatastore} from '@toolkit/providers/firebase/DataStore';
import {initFirebaseServer} from '@toolkit/providers/firebase/server/Config';
import {
  AuthenticateMiddleware,
  RolesCheckMiddleware,
  initMiddlewares,
  providersMiddleware,
} from '@toolkit/providers/firebase/server/Handler';

// Follow the wiki below to enable Firestore security rule enforcement in Functions:
// https://www.internalfb.com/intern/wiki/NPE/Central_Engineering/NPE_Kit/Guides/Enforcing_Security_Rules_in_Firebase_Functions_or_Server_Code/
initFirebaseServer(FIREBASE_CONFIG, APP_CONFIG);

const providers = [FirestoreDatastore, APP_CONFIG];

initMiddlewares([
  providersMiddleware(providers),
  AuthenticateMiddleware,
  RolesCheckMiddleware,
]);

exports.minders = require('./handlers');
