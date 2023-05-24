import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRoute} from '@react-navigation/native';
import {User, requireLoggedInUser} from '@toolkit/core/api/User';
import {AdhocError} from '@toolkit/core/util/CodedError';
import {Opt} from '@toolkit/core/util/Types';
import {DataCallback} from '@toolkit/data/DataCache';
import {
  BaseModel,
  EdgeSelector,
  Field,
  HasId,
  InverseField,
  Model,
  ModelClass,
  ModelUtil,
  MutateOpts,
  TString,
  Updater,
  UpdaterValue,
  useDataStore,
} from '@toolkit/data/DataStore';
import {OutlineView} from '@app/AppLayout';
import {INITIAL_OUTLINE, LegacyOutlineItem} from './InitialOutline';

export const STATE_VISIBILITY: Record<string, OutlineItemState[]> = {
  focus: ['cur', 'top'],
  review: ['new', 'waiting', 'soon'],
  pile: ['soon', 'later'],
  waiting: ['waiting'],
  all: ['cur', 'top', 'waiting', 'new', 'soon', 'later', 'done'],
  notdone: ['cur', 'top', 'new', 'soon', 'later'],
  done: ['done'],
};

export const STATE_PRIORITY = [
  'waiting',
  'new',
  'top',
  'cur',
  'soon',
  'later',
  'done',
];

export type OutlineItemState =
  | 'waiting'
  | 'new'
  | 'top'
  | 'cur'
  | 'soon'
  | 'later'
  | 'done';

export type OutlineItemVisibilityFilter =
  | 'focus'
  | 'review'
  | 'pile'
  | 'waiting'
  | 'all'
  | 'notdone'
  | 'done';
/**
 * Project is a home for multiple minders.
 *
 * Users can have one or more top-level projects.
 */
@Model({name: 'project'})
export class MinderProject extends BaseModel {
  /** Person who owns the project */
  @Field() owner: User;

  /** Name fo this project */
  @Field() name: string;

  /** Minders in this project */
  @InverseField() minders?: Minder[];
}

@Model({name: 'minder'})
export class Minder extends BaseModel {
  /** Project this minder belongs to */
  @Field({inverse: {field: 'minders', many: true}}) project?: MinderProject;

  /**
   * Optional ID parent Minder
   * ID for now until we can have model types refer to themselves.
   * At that point we'll switch to directly load`parent: Minder`
   */
  @Field() parentId?: string;

  /** Text of the minder */
  @Field() text: string;

  /** Current state */
  @Field(TString) state: OutlineItemState;

  /* Parent minder - derived for now */
  parent?: Minder;

  /* Relative order as a child of the parent minder  */
  @Field() order: number;

  /* Child minders - derived for now */
  children?: Minder[];

  /* Snoozing hides a "waiting" item from most UI until past the date */
  @Field() snoozeTil?: number;

  /**
   * When snoozed, although the item state is now "waiting",
   * we keep track of the original state for use in filtering
   */
  @Field(TString) unsnoozedState?: OutlineItemState;

  /**
   * UI flag to surface a parent minder as a top-level item
   * instead in the normal hierarchy while it is pinned
   */
  @Field() pinned?: boolean;

  /**
   * UI flag to show this parent minder in a "collapsed" outline
   * state, where the children aren't shown.
   */
  @Field() collapsed?: boolean;

  /**
   * To avoid overlapping modifications, update operations send in a
   * version number from when they read, == the modified time.
   *
   * This shold become a datastore feature.
   */
  @Field() checkVersion: number;

  /**
   * Cacluated runtime UI state used to track whether a minder is currently visible in the UI.
   *
   * Note: This assumes there's only one active view in the app at a time - is that accurate?
   * Maybe instead this could just be a big hash per logical "view".
   */
  hidden?: boolean;

  /* Caclulcated, sorted, visible children */
  visibleChildren?: Minder[];
}

/**
 * Minder pages can have a top-level item that is either a Minder
 * or a project. This type covers the common fields from both used for rendering.
 */
export type Top = {
  /* The type */
  type: 'minder' | 'project';

  /* Datastore ID */
  id: string;

  /* Text */
  text: string;

  /* Children */
  children: Minder[];
};

/**
 * The UI state of the project.
 *
 *
 * This is calculated from URL parameters, and the latest is stored
 * locally on your device for when URL parameters aren't set.
 */
export type MinderUiState = {
  /** Current view */
  view?: OutlineView;

  /** Current visibility filter, calculated from `view` */
  filter?: OutlineItemVisibilityFilter;

  /** The currently focused minder - only children of this minder are show */
  top?: string;

  /** The current project */
  project?: string;
};

function parseJsonOr<T>(value: Opt<string>, defaultValue: T): T {
  try {
    if (value != null) {
      return JSON.parse(value);
    }
  } catch (e) {}

  return defaultValue;
}

export async function saveLatestUiState(minderUiState: Partial<MinderUiState>) {
  await AsyncStorage.setItem('minderUiState', JSON.stringify(minderUiState));
}

export async function getSavedUiState(): Promise<Opt<MinderUiState>> {
  const savedUiState = await AsyncStorage.getItem('minderUiState');
  return parseJsonOr(savedUiState, null);
}

// Should this be set in React context? Would make life easier for user-based caching, etc... otherwise
// we're using a big global map.
// Eh we'll start with a map thing

export function useMinderStore() {
  const user = requireLoggedInUser();
  const projectStore = useDataStore(MinderProject);
  const minderStore = useDataStore(Minder);

  async function getProjects() {
    // TOOD: Project sorting
    let projects = await projectStore.getMany({
      query: {where: [{field: 'owner', op: '==', value: user.id}]},
    });
    return projects;
  }

  /**
   * Get the project or minder of the given ID,
   * as well as all of it's chilren.
   */
  async function getAll(
    topId: string,
  ): Promise<{top: Top; project: MinderProject}> {
    let project, minders, top: Top;
    topId = topId.replace('>', ':');

    if (topId.indexOf('minder:') === 0) {
      const minder = nonNull(
        await minderStore.get(topId, {edges: [MinderProject]}),
        'Minder not found',
      );

      project = (await getProject(minder.project!.id))!;
      minders = project!.minders!;
      const minderInProject: Minder = minders.find(m => m.id === topId)!;
      top = {
        type: 'minder',
        id: topId,
        text: minderInProject!.text,
        children: minderInProject.children!,
      };
    } else {
      project = nonNull(await getProject(topId), 'Project not found');
      top = {
        type: 'project',
        id: topId,
        text: project.name,
        children: project.minders!.filter(m => m.parentId == null),
      };
    }

    return {top, project};
  }

  async function getAllDeprecated() {
    let projects = await projectStore.getMany({
      query: {where: [{field: 'owner', op: '==', value: user.id}]},
      edges: [[MinderProject, Minder, 1]],
    });

    if (projects.length == 0) {
      const ol = INITIAL_OUTLINE;
      for (const project of ol.top.sub) {
        const newProject = await projectStore.create({
          owner: {id: user.id},
          name: project.text,
        });
        await addAll(
          project.sub as any as Partial<LegacyOutlineItem>[],
          newProject,
          null,
        );
      }
      projects = await projectStore.getMany({
        query: {where: [{field: 'owner', op: '==', value: user.id}]},
        edges: [[MinderProject, Minder, 1]],
      });
    }
    await linkAndFixMinders(projects);

    for (const project of projects) {
      project.minders = project.minders!.sort(minderSort);
    }

    return {projects};
  }
  async function getProject(id: string) {
    const project = await projectStore.get(id, {
      edges: [[MinderProject, Minder, 1]],
    });
    if (project) {
      await linkAndFixMinders([project]);
      project.minders = project.minders!.sort(minderSort);
    }
    return project;
  }

  async function forEachMinder(
    projects: MinderProject[],
    fn: (minder: Minder, project: MinderProject) => void,
  ) {
    for (const project of projects) {
      for (const minder of project.minders!) {
        await fn(minder, project);
      }
    }
  }

  async function linkAndFixMinders(projects: MinderProject[]) {
    const allMinders: Record<string, Minder> = {};

    // Cache all minders
    await forEachMinder(projects, minder => (allMinders[minder.id] = minder));

    // Link parents and children
    await forEachMinder(projects, async minder => {
      if (minder.parentId) {
        const parent = allMinders[minder.parentId];
        if (parent) {
          parent.children = parent.children ?? [];
          parent.children.push(minder);
        } else {
          console.log('Fixing minder with no parent');
          await minderStore.update({
            id: minder.id,
            parentId: UpdaterValue.fieldDelete(),
          });
        }
        // Disabled this as these references were broken after
        // incremental UI updates from data changes
        // minder.parent = parent;
      }
    });

    // Order children
    await forEachMinder(projects, minder => {
      if (minder.children) {
        minder.children.sort((a, b) => a.order - b.order);
        // TODO: Filter out hidden kids
        minder.visibleChildren = minder.children;
      }
    });

    // Set parent projects
    await forEachMinder(projects, (minder, project) => {
      minder.project = project;
    });
  }

  async function create(value: Updater<Minder>, opts?: MutateOpts) {
    const minder = await minderStore.create(value, opts);
    triggerData(Minder, minder.id!);
    return minder;
  }

  async function remove(id: string) {
    await minderStore.remove(id);
    triggerData(Minder, id);
  }

  async function addAll(
    items: Partial<LegacyOutlineItem>[],
    project: MinderProject,
    parent: Opt<Minder>,
  ) {
    for (const item of items) {
      const minderFields: Updater<Minder> = {
        state: item.state,
        text: item.text,
        order: item.id,
        project,
      };
      if (parent) {
        minderFields.parentId = parent.id;
      }
      const newMinder = await minderStore.create(minderFields);
      await addAll(item.sub ?? [], project, newMinder);
    }
  }

  async function get(id: string, opts?: {edges?: EdgeSelector[]}) {
    return minderStore.get(id, opts);
  }

  // TODO disallow setting parent and project until they work.
  async function update(
    minder: Minder,
    fields: Updater<Minder>,
    opts?: MutateOpts,
  ) {
    if (fields.state != null && fields.state != 'waiting') {
      fields.snoozeTil = UpdaterValue.fieldDelete();
      fields.unsnoozedState = UpdaterValue.fieldDelete();
    }
    fields.id = minder.id;
    // TODO: snooze that sets unsnoozed state and snoozeTil correctly

    let modified;
    for (const key of Object.keys(fields)) {
      const typedKey = key as keyof Minder;
      if (fields[typedKey] !== minder[typedKey]) {
        modified = true;
      }
    }

    if (modified) {
      await minderStore.update(fields, opts);
      triggerData(Minder, fields.id!);
    }
  }

  function listen(id: string, fn: DataCallback<Minder>) {
    return minderStore.listen(id, fn);
  }

  return {
    get,
    create,
    update,
    remove,
    getAll,
    getAllDeprecated,
    getProject,
    getProjects,
    listen,
  };
}

// TODO: Move these to a utilty
// Listeners have a namespace, a key, anda  callback
type Callback = (key: string) => void;
const listeners: Record<string, Record<string, Callback[]>> = {};
type UnsubscribeKey = {namespace: string; keys: string[]; callback: Callback};

export function dataListen(
  type: ModelClass<any>,
  keys: string[],
  callback: Callback,
) {
  return listen(ModelUtil.getName(type), keys, callback);
}

// self cleaning
export function useDataListen(
  type: ModelClass<any>,
  keys: string[],
  callback: Callback,
) {
  React.useEffect(() => {
    return dataListen(type, keys, id => callback(id));
  }, [type, keys]);
}

export function useRerenderChange(type: ModelClass<any>, keys: string[]) {
  const [_, setVersion] = React.useState(0);
  React.useEffect(() => {
    return dataListen(type, keys, () => setVersion(v => v + 1));
  }, [type, keys]);
}

export function useLiveData<T extends HasId>(
  type: ModelClass<T>,
  entities: T[],
): T[] {
  const [values, setValues] = React.useState(entities);
  const ids = entities.map(e => e.id);
  const store = useDataStore(type);

  React.useEffect(() => {
    return dataListen(type, ids, async id => {
      const newValue = await store.get(id);
      // TODO: What if it's deleted?
      if (newValue) {
        const newValues = [...values];
        const index = newValues.findIndex(v => v.id == id);
        if (index !== -1) {
          newValues[index] = newValue;
          setValues(newValues);
        }
      }
    });
  }, [type, ids]);

  return values;
}

export function useLiveDataOne<T extends HasId>(
  type: ModelClass<T>,
  entity: T,
): T {
  const [value] = useLiveData(type, [entity]);
  return value;
}

// Todo: Just return a function to unsub
export function listen(
  namespace: string,
  keys: string[],
  callback: Callback,
): () => void {
  for (const key of keys) {
    listeners[namespace] = listeners[namespace] ?? {};
    listeners[namespace][key] = listeners[namespace][key] ?? [];
    listeners[namespace][key].push(callback);
  }
  return () => unlisten({namespace, keys, callback});
}

export function unlisten(to: UnsubscribeKey) {
  const {namespace, keys, callback} = to;
  for (const key of keys) {
    if (!listeners[namespace] || !listeners[namespace][key]) {
      return;
    }
    listeners[namespace][key] = listeners[namespace][key].filter(
      cb => cb != callback,
    );
  }
}

export function trigger(namespace: string, key: string) {
  if (!listeners[namespace]) {
    return;
  }
  const matches = listeners[namespace][key] ?? [];
  const wildcardMatches = listeners[namespace]['*'] ?? [];

  const callbacks = [...matches, ...wildcardMatches];
  for (const callback of callbacks) {
    callback(key);
  }
}

export function triggerData(type: ModelClass<any>, key: string) {
  trigger(ModelUtil.getName(type), key);
}

/**
 * Gets parents of minder, starting from the top-most
 *
 * Requires that parent tree is populated, which won't
 * be true on queries that get updated informatio.
 */
export function parentsOf(minder: Minder): Minder[] {
  const parents: Minder[] = [];
  while (minder.parent) {
    parents.unshift(minder.parent);
    minder = minder.parent;
  }
  return parents;
}

export function minderSort(lhs: Minder, rhs: Minder) {
  /*
    if (isParent(lhs) && isParent(rhs)) {
      if (lhs.created.getTime() != rhs.created.getTime()) {
        // tag: DATELOGIC
        return rhs.created.getTime() - lhs.created.getTime();
      } else {
        // Hack for creation sort for items from before creation was saved
        return myIndex(rhs) - myIndex(rhs);
      }
    } else if (isParent(lhs) && !isParent(rhs)) {
      return -1;
    } else if (isParent(rhs) && !isParent(lhs)) {
      return 1;
    }*/

  const pridiff =
    STATE_PRIORITY.indexOf(lhs.state) - STATE_PRIORITY.indexOf(rhs.state);

  if (pridiff != 0) {
    return pridiff;
  }

  const lhsmod = lhs.updatedAt ?? 0;
  const rhsmod = rhs.updatedAt ?? 0;
  return rhsmod - lhsmod;
}

export function isVisible(minder: Minder, filter: OutlineItemVisibilityFilter) {
  const visibleStates = STATE_VISIBILITY[filter];

  const now = Date.now();

  // Soon items only show up in review for 60 days (testing with 30s)
  if (filter === 'review' && minder.state === 'soon') {
    const modified = minder.updatedAt ?? 0;
    const daysBack = (now - modified) / (1000 * 3600 * 24);
    if (daysBack > 0.00034) {
      return false;
    }
  }

  // New items show up everywhere for 5 minutes (testing with 30s)
  if (minder.state === 'new') {
    const created = minder.createdAt ?? 0;
    const minutesBack = (now - created) / (1000 * 60);
    if (minutesBack < 0.5) {
      return true;
    }
  }

  // Outside of 'waiting' view, waiting items are hidden until snoozeTil
  if (minder.state === 'waiting' && filter !== 'waiting') {
    const snoozeTil = minder.snoozeTil ?? 0;
    const snoozed = now < snoozeTil;

    if (snoozed) {
      return false;
    }

    // If not snoozed, only shows up in views where it **would** have shown up before
    const prevState = minder.unsnoozedState;
    if (
      prevState &&
      visibleStates.includes(prevState) &&
      visibleStates.includes('waiting')
    ) {
      return true;
    }
  }

  // Default logic
  return visibleStates.includes(minder.state);
}

export function isParent(minder: Minder) {
  return minder.children && minder.children.length > 0;
}

export function hasVisibleKids(minder: Minder) {
  return minder.visibleChildren && minder.visibleChildren.length > 0;
}

export function getVisibleChildren(minder: Minder) {
  return minder.visibleChildren ?? [];
}

export function getChildren(minder: Minder) {
  return minder.children ?? [];
}

export function nonNull<T>(value: Opt<T>, message: string): T {
  if (value == null) {
    throw AdhocError(message);
  }
  return value;
}
/**
 * Create a flat array of all minders matching the filter, including recursive children.
 */
export function flatList(
  minders: Opt<Minder[]>,
  filter: OutlineItemVisibilityFilter,
  out: Minder[] = [],
) {
  minders?.forEach(minder => {
    //minders = project!.minders!.filter(m => isVisible(m, filter));
    if (isVisible(minder, filter)) {
      out.push(minder);
    }
    flatList(minder.children, filter, out);
  });
  return out;
}

export function useMinderListParams() {
  const route = useRoute();
  const params = route.params as any;

  const view = params?.view ?? 'focus';
  const top = params?.top.replace('>', ':');
  const isProject = top && top.startsWith('project:');

  return {view, top, isProject};
}
