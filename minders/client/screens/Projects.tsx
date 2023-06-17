/**
 * TODO: Describe what this screen is doing :)
 */

import * as React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import DraggableFlatList, {
  DragEndParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useAction} from '@toolkit/core/client/Action';
import {useReload} from '@toolkit/core/client/Reload';
import {Opt} from '@toolkit/core/util/Types';
import {useLoad, withLoad} from '@toolkit/core/util/UseLoad';
import {Updater, useDataStore} from '@toolkit/data/DataStore';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {useComponents} from '@toolkit/ui/components/Components';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {
  Minder,
  MinderProject,
  MinderStoreContext,
  OutlineItemState,
  useMinderStore,
} from '@app/common/MinderApi';
import {IconButton} from '@app/components/AppComponents';
import {BinaryAlert} from '@app/util/Alert';
import {downloadOrShareJson, jsonDataUrl} from '@app/util/Useful';
import Minders from './Minders';

type Props = {};

const Projects: Screen<Props> = props => {
  const user = requireLoggedInUser();
  const {H2, Body, Button} = useComponents();
  const minderApi = useMinderStore();
  const minderStore = useDataStore(Minder);
  const projectStore = useDataStore(MinderProject);
  const {projects, setData} = useLoad(props, load);
  const [ProjectTitleInput, projectTitle, setProjectTitle] = useTextInput('');
  const [onImport, importing] = useAction(importData);
  const [onDelete, deleting] = useAction(deleteProject);
  const reload = useReload();
  const {navTo} = useNav();

  async function onNewProject() {
    await projectStore.create({
      name: projectTitle,
      order: projects[projects.length - 1].order! + 1,
      owner: user,
    });
    reload();
  }

  async function onDrag({data, from, to}: DragEndParams<MinderProject>) {
    setData({projects: data});

    let order;
    if (to === 0) {
      order = projects[0].order! - 1;
    } else if (to == projects.length - 1) {
      order = projects[projects.length - 1].order! + 1;
    } else {
      order = (projects[to - 1].order! + projects[to].order!) / 2;
    }

    projects[from] = await projectStore.update({id: projects[from].id, order});
  }

  function goTo(projectId: string) {
    navTo(Minders, {top: projectId.replace(':', '>'), view: 'focus'});
  }

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <H2 style={S.h2}>Projects</H2>

      <DraggableFlatList
        data={projects}
        onDragEnd={onDrag}
        renderItem={({item, drag}) => (
          <ScaleDecorator>
            <TouchableOpacity onPress={() => goTo(item.id)} onLongPress={drag}>
              <View style={S.listItem}>
                <Text style={{fontSize: 18, flexGrow: 1, flexBasis: 200}}>
                  {item.name}
                </Text>
                <IconButton
                  icon="ion:close-circle-outline"
                  size={28}
                  style={{marginRight: -4}}
                  onPress={() => promptDelete(item.id)}
                />
                <IconButton
                  icon="ion:cloud-download-outline"
                  size={24}
                  onPress={() => onExport(item.id)}
                />
              </View>
            </TouchableOpacity>
          </ScaleDecorator>
        )}
        keyExtractor={p => p.id}
      />
      <Body style={{fontStyle: 'italic', textAlign: 'center'}}>
        Long click/press to drag re-order
      </Body>

      <View style={{height: 36}} />
      <H2 style={S.h2}>Create Project</H2>
      <View style={{marginHorizontal: 20}}>
        <ProjectTitleInput type="primary" label="Project name" />

        <View style={S.buttonRow}>
          <Button
            type="secondary"
            onPress={onImport}
            loading={importing}
            style={{marginRight: 10}}
            disabled={projectTitle === '' || importing}>
            Import Data
          </Button>
          <Button
            type="primary"
            onPress={onNewProject}
            disabled={projectTitle === ''}>
            Create New
          </Button>
        </View>
      </View>
    </ScrollView>
  );

  async function load() {
    let projects = await minderApi.getProjects();
    // Ensure projects are ordered. If any aren't set, renumber all to be safe
    if (projects.filter(p => p.order == null).length > 0) {
      const updates = projects.map((p, idx) =>
        projectStore.update({id: p.id, order: idx}),
      );
      projects = await Promise.all(updates);
    }
    projects = projects.sort((a, b) => (a.order! > b.order! ? 1 : -1));
    return {projects};
  }

  async function onExport(projectId: string) {
    const {name, json} = await minderApi.exportProject(projectId);
    return downloadOrShareJson(name, jsonDataUrl(json));
  }

  async function importData() {
    const doc = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
    });
    if (doc.type !== 'cancel') {
      const data = await fetch(doc.uri);
      const json = await data.json();
      const ctx = {minderStore, projectStore, user};
      await createProjectFromJson(ctx, projectTitle, json);
    }
    setProjectTitle('');
    reload();
  }

  async function promptDelete(projectId: string) {
    BinaryAlert('Are you sure you want to delete this projec?', null, () =>
      onDelete(projectId),
    );
  }

  async function deleteProject(id: string) {
    const projectWithData = await minderApi.getProject(id);

    await Promise.all(
      projectWithData!.minders!.map(m => minderStore.remove(m.id)),
    );
    await projectStore.remove(id);

    reload();
  }
};

async function createProjectFromJson(
  ctx: MinderStoreContext,
  name: string,
  json: Partial<MinderProject> | Partial<LegacyJson>,
) {
  const {projectStore, user} = ctx;

  if ('sub' in json) {
    await createProjectFromLegacyJson(ctx, name, json);
    return;
  }

  const {id, minders, ...fields} = Object.assign(
    json,
  ) as Updater<MinderProject>;
  fields.name = name;
  fields.owner = {id: user.id};
  const project = await projectStore.create(fields);

  await createMindersFromJson(ctx, project, null, minders as Minder[]);
}

async function createMindersFromJson(
  ctx: MinderStoreContext,
  project: Partial<MinderProject>,
  parent: Opt<Minder>,
  minders: Partial<Minder>[],
) {
  const {minderStore} = ctx;
  async function createMinderAndChildren(item: Partial<Minder>) {
    const {id, children, ...fields} = Object.assign(item) as Updater<Minder>;
    fields.project = {id: project.id!};
    fields.parentId = parent?.id;
    const minder = await minderStore.create(fields);

    if (children) {
      await createMindersFromJson(ctx, project, minder, children as Minder[]);
    }
    return minder;
  }

  const promises = minders.map(item => createMinderAndChildren(item));
  await Promise.all(promises);
}

type LegacyJson = {
  text: string;
  id: number;
  sub?: LegacyJson[];
  state?: OutlineItemState;
  created?: number;
  modified?: number;
  snoozeTil?: number;
  snoozeState?: Opt<OutlineItemState>;
  pinned?: boolean;
};

async function createProjectFromLegacyJson(
  ctx: MinderStoreContext,
  name: string,
  json: Partial<LegacyJson>,
) {
  const {projectStore, user} = ctx;
  const fields = {
    name,
    createdAt: json.created,
    updatedAt: json.modified,
    owner: user,
  };
  const project = await projectStore.create(fields);
  await createMindersFromLegacyJson(ctx, project, null, json.sub ?? []);
}

// Null values are treated as a delete, we need to remove them
function removeNulls<T>(obj: any) {
  for (const key in obj) {
    if (obj[key] == null) {
      delete obj[key];
    }
  }
  return obj;
}

async function createMindersFromLegacyJson(
  ctx: MinderStoreContext,
  project: {id: string},
  parent: Opt<{id: string}>,
  items: LegacyJson[],
) {
  const {minderStore} = ctx;
  async function createMinderAndChildren(item: Partial<LegacyJson>) {
    const fields = {
      project,
      parentId: parent?.id,
      text: item.text,
      state: item.state,
      createdAt: item.created,
      updatedAt: item.modified,
      snoozeTil: item.snoozeTil,
      unsnoozeState: item.snoozeState,
    };
    const minder = await minderStore.create(removeNulls(fields));

    if (item.sub) {
      await createMindersFromLegacyJson(ctx, project, minder, item.sub);
    }
    return minder;
  }

  const promises = items.map(item => createMinderAndChildren(item));
  await Promise.all(promises);
}

Projects.title = 'Projects';

const S = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  picker: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.29)',
    borderRadius: 32,
    fontWeight: '500',
    fontSize: 18,
    fontFamily: 'Roboto',
    marginTop: 10,
    marginHorizontal: 20,
    lineHeight: 20,
  },
  h2: {
    marginBottom: 20,
  },
  listItem: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F8FC',
    paddingVertical: 2,
    paddingLeft: 24,
    paddingRight: 8,
    marginHorizontal: 20,
    borderRadius: 40,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 20,
  },
});

export default Projects;
