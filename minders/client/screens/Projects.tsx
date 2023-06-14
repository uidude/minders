/**
 * TODO: Describe what this screen is doing :)
 */

import * as React from 'react';
import {Platform, ScrollView, StyleSheet, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useAction} from '@toolkit/core/client/Action';
import {useReload} from '@toolkit/core/client/Reload';
import {Opt} from '@toolkit/core/util/Types';
import {useLoad, withLoad} from '@toolkit/core/util/UseLoad';
import {Updater, useDataStore} from '@toolkit/data/DataStore';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {useComponents} from '@toolkit/ui/components/Components';
import {Screen} from '@toolkit/ui/screen/Screen';
import {
  Minder,
  MinderProject,
  MinderStoreContext,
  OutlineItemState,
  useMinderStore,
} from '@app/common/MinderApi';
import {BinaryAlert} from '@app/util/Alert';
import {downloadOrShareJson, jsonDataUrl} from '@app/util/Useful';

type Props = {};

const Projects: Screen<Props> = withLoad(props => {
  const user = requireLoggedInUser();
  const {H2, Body, Button} = useComponents();
  const [projectId, setProjectId] = React.useState('');
  const minderApi = useMinderStore();
  const minderStore = useDataStore(Minder);
  const projectStore = useDataStore(MinderProject);
  const {projects} = useLoad(props, load);
  const [ProjectTitleInput, projectTitle, setProjectTitle] = useTextInput('');
  const [onImport, importing] = useAction(importData);
  const [onDelete, deleting] = useAction(deleteProject);
  const reload = useReload();

  const paddingStyle = Platform.OS === 'ios' ? {} : {padding: 16};

  function onSelect(newId: string) {
    setProjectId(newId);
  }

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <H2>Projects</H2>

      <Picker
        style={[S.picker, paddingStyle]}
        selectedValue={projectId}
        onValueChange={onSelect}
        numberOfLines={2}
        mode="dropdown">
        <Picker.Item label="Choose" value="" />
        {projects.map(p => (
          <Picker.Item key={p.id} label={p.name} value={p.id} />
        ))}
      </Picker>
      <View
        style={{
          marginTop: 10,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}>
        <Button
          loading={deleting}
          onPress={promptDelete}
          disabled={projectId == '' || deleting}>
          Delete
        </Button>
        <View style={{width: 10}} />
        <Button type="primary" onPress={exportIt} disabled={projectId == ''}>
          Export
        </Button>
      </View>

      <View style={{height: 36}} />
      <H2>New Project</H2>
      <ProjectTitleInput
        type="primary"
        label="New project name"
        style={S.titleInput}
      />

      <View
        style={{
          marginTop: 10,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}>
        <Button
          type="primary"
          onPress={onImport}
          loading={importing}
          disabled={projectTitle == '' || importing}>
          Import
        </Button>
      </View>
    </ScrollView>
  );

  async function load() {
    const projects = await minderApi.getProjects();
    return {projects};
  }

  async function exportIt() {
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

  async function promptDelete() {
    BinaryAlert('Are you sure you want to delete this projec?', null, () =>
      onDelete(projectId),
    );
  }

  async function deleteProject(id: string) {
    const projectWithData = await minderApi.getProject(projectId);

    await Promise.all(
      projectWithData!.minders!.map(m => minderStore.remove(m.id)),
    );
    await projectStore.remove(projectId);

    reload();
  }
});

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
    const minder = await minderStore.create(fields);

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
  titleInput: {
    marginHorizontal: 20,
  },
});

export default Projects;
