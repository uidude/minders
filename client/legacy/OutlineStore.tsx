/**
 * @format
 */

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import {rateLimit} from '../util/Useful';
import {INITIAL_OUTLINE} from './InitialOutline';
import Outliner, {type Outline} from './outliner';

const APP_DB_FOLDER = __DEV__ ? 'outliner-testing/' : 'outlinerv1/';

const localStorage = window.localStorage || {};

const FIELDS_TO_SAVE = [
  'sub',
  'item',
  'ui',
  'state',
  'text',
  'hidden',
  'visibilityFilter',
  'closed',
  'id',
  'docId',
  'view',
  'top',
  'version',
  'baseVersion',
  'created',
  'modified',
  'focus',
  'pinned',
  /** Added **/
  '',
  'sub',
  'snoozeState',
  'snoozeTil',
];

const DATE_KEYS = {created: true, modified: true, snoozeTil: true};

const jsonSerializer = (key: any, value: any) => {
  if (!isNaN(key)) {
    return value;
  }
  if (FIELDS_TO_SAVE.includes(key)) {
    if (key in DATE_KEYS) {
      return new Date(value).getTime();
    }
    return value;
  }
  return null;
};

function convertOutlineFromSerializedTypes(node: any) {
  for (const key in node) {
    const value = node[key];
    if (key in DATE_KEYS) {
      node[key] = new Date(value);
    }
    if (typeof value == 'object') {
      convertOutlineFromSerializedTypes(value);
    }
  }
  return node;
}

class OutlineStore {
  userId: string;
  loaded: boolean = false;
  loading: boolean = true;
  loadPromise: Promise<void>;
  outliner: Outliner;
  errorReporter: (e: Error) => void | Promise<void>;

  constructor(userId: string) {
    this.userId = userId;
  }

  getUserPath() {
    return this.userId;
  }

  load(): Promise<void> {
    var self = this;

    this.loadPromise = firebase
      .database()
      .ref(APP_DB_FOLDER + this.getUserPath() + '/main/outline')
      .once('value')
      .then(snapshot => self.loadData(snapshot.val()))
      .catch(error => self.failedToLoad(error));

    return this.loadPromise;
  }

  setErrorReporter(reporter: (e: Error) => void | Promise<void>) {
    this.errorReporter = reporter;
  }

  failedToLoad(error: Error): void {
    this.loading = false;
    console.log('Error Loading', error);
    if (this.errorReporter) {
      this.errorReporter(new Error('Failed to load'));
    }
  }

  loadData(data: Object) {
    this.loading = false;
    const outline = convertOutlineFromSerializedTypes(data) || INITIAL_OUTLINE;
    outline.version = outline.version || Date.now();

    this.outliner = new Outliner(outline);
    this.outliner.saver = this.save.bind(this);
    this.loaded = true;
  }

  async save(outliner: Outliner) {
    const outline = outliner.outline;
    outline.top = outliner.data;
    // Base version is the version you loaded
    // Save will reject if changed since base version
    outline.baseVersion = outline.version;
    outline.version = Date.now();
    localStorage['outline'] = JSON.stringify(outline, jsonSerializer, 2);
    await this._saveToFirebase(
      outline,
      'outline',
      this.getUserPath() + '/main/',
    );
    rateLimit('outlinesaver', this.saveBackup.bind(this, outline), 30000);
  }

  async _saveToFirebase(outline: Outline, id: string, folder: string = '') {
    const safeId = id.replace(/\s/g, '-').replace(/,/g, '').replace(/\//g, '-');

    try {
      await firebase
        .database()
        .ref(APP_DB_FOLDER + folder + safeId)
        .set(JSON.parse(JSON.stringify(outline, jsonSerializer, 2)));
    } catch (e) {
      if (this.errorReporter) {
        await this.errorReporter(e as Error);
      }
      throw e;
    }
  }

  async saveBackup(outline: Outline) {
    const id: string = 'test-id::' + new Date(Date.now()).toLocaleString();
    this._saveToFirebase(outline, id, this.getUserPath() + '/backup/');
  }
}

export default OutlineStore;
