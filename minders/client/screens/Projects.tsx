/**
 * TODO: Describe what this screen is doing :)
 */

import * as React from 'react';
import {Platform, ScrollView, StyleSheet, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useAction} from '@toolkit/core/client/Action';
import {useReload} from '@toolkit/core/client/Reload';
import {Opt} from '@toolkit/core/util/Types';
import {Updater, useDataStore} from '@toolkit/data/DataStore';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {useComponents} from '@toolkit/ui/components/Components';
import {Screen} from '@toolkit/ui/screen/Screen';
import {Minder, MinderProject, Top, useMinderStore} from '@app/common/Minders';
import {BinaryAlert} from '@app/util/Alert';
import {useLoad, withLoad} from '@app/util/UseLoad';

type Props = {};

const Projects: Screen<Props> = withLoad(props => {
  requireLoggedInUser();
  const {H2, Body, Button} = useComponents();
  const [projectId, setProjectId] = React.useState('');
  const minderStore = useMinderStore();
  const projectStore = useDataStore(MinderProject);
  const {projects} = useLoad(props, load);
  const [ProjectTitleInput, projectTitle] = useTextInput('');
  const [onImport, importing] = useAction(importData);
  const [onDelete, deleting] = useAction(deleteProject);
  const createProjectFromJson = useCreateProjectFromJson();
  const reload = useReload();

  function onSelect(newId: string) {
    setProjectId(newId);
  }

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <H2>Existing Projects</H2>

      <Picker
        style={S.picker}
        selectedValue={projectId}
        onValueChange={onSelect}>
        <Picker.Item label="Choose project" value="" />
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
        <Button type="primary" onPress={exportData} disabled={projectId == ''}>
          Export
        </Button>
      </View>

      <View style={{height: 36}} />
      <H2>New Project</H2>
      <ProjectTitleInput
        type="primary"
        label="New project name"
        style={{width: 400}}
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
    const projects = await minderStore.getProjects();
    return {projects};
  }

  async function exportData() {
    const {top, project: projectWithData} = await minderStore.getAll(projectId);
    projectWithData.minders = top.children;

    const dataUrl = jsonDataUrl(toJson(projectWithData!));
    if (Platform.OS === 'web') {
      downloadFile(`${projectWithData!.name}.json`, dataUrl);
    } else {
      Sharing.shareAsync(jsonDataUrl(toJson(projectWithData!)));
    }
  }

  async function importData() {
    const doc = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
    });
    if (doc.type !== 'cancel') {
      const data = await fetch(doc.uri);
      const json = await data.json();
      await createProjectFromJson(projectTitle, json);
    }
    reload();
  }

  async function promptDelete() {
    BinaryAlert('Are you sure you want to delete this projec?', null, () =>
      onDelete(projectId),
    );
  }

  async function deleteProject(id: string) {
    const projectWithData = await minderStore.getProject(projectId);

    await Promise.all(
      projectWithData!.minders!.map(m => minderStore.remove(m.id)),
    );
    await projectStore.remove(projectId);

    reload();
  }
});

const SERIALIZED_KEYS: (keyof Minder | keyof MinderProject)[] = [
  'id',
  'createdAt',
  'updatedAt',
  'name',
  'minders',
  'text',
  'state',
  'children',
  'snoozeTil',
  'unsnoozedState',
  'pinned',
];

function toJson(item: MinderProject | Minder | Top) {
  return JSON.stringify(item, SERIALIZED_KEYS, 2);
}

function jsonDataUrl(jsonString: string) {
  const base64 = btoa(jsonString);
  return 'data:application/json;base64,' + base64;
}

function downloadFile(filename: string, dataUrl: string) {
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function useCreateProjectFromJson() {
  const projectStore = useDataStore(MinderProject);
  const minderStore = useDataStore(Minder);
  const user = requireLoggedInUser();

  async function createProjectFromJson(
    name: string,
    json: Partial<MinderProject>,
  ) {
    const {id, minders, ...fields} = Object.assign(
      json,
    ) as Updater<MinderProject>;
    fields.name = name;
    fields.owner = {id: user.id};
    const project = await projectStore.create(fields);

    await createMindersFromJson(project, null, minders as Minder[]);
  }

  async function createMindersFromJson(
    project: Partial<MinderProject>,
    parent: Opt<Minder>,
    minders: Partial<Minder>[],
  ) {
    async function createMinderAndChildren(item: Partial<Minder>) {
      const {id, children, ...fields} = Object.assign(item) as Updater<Minder>;
      fields.project = {id: project.id!};
      fields.parentId = parent?.id;
      const minder = await minderStore.create(fields);

      if (children) {
        await createMindersFromJson(project, minder, children as Minder[]);
      }
      return minder;
    }

    const promises = minders.map(item => createMinderAndChildren(item));
    await Promise.all(promises);
  }

  return createProjectFromJson;
}

Projects.title = 'Minder Projects';

const S = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    maxWidth: 450,
    alignSelf: 'center',
  },
  picker: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.29)',
    borderRadius: 32,
    fontWeight: '500',
    fontSize: 18,
    //color: '#DE2B2B',
    fontFamily: 'Roboto',
    marginTop: 10,
    width: 400,
  },
});

export default Projects;
