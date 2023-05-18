/**
 * @format
 */

import * as React from 'react';
import {StyleProp, Text, TextStyle, TouchableHighlight} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {withAsyncLoad} from '@toolkit/core/util/Loadable';
import {useNav} from '@toolkit/ui/screen/Nav';
import {MinderProject, useMinderStore} from '@app/model/Minders';
import {useOutlineState, useOutliner} from '../model/OutlinerContext';
import {OutlineItem} from '../model/outliner';
import {useShortcut} from '../util/Shortcuts';
import {Menu} from './AppComponents';

type Props = {
  style?: StyleProp<TextStyle>;
  async: {
    projects: MinderProject[];
  };
};
function OutlineFocusPicker(props: Props) {
  const {style} = props;
  const {projects} = props.async;
  const outliner = useOutliner();
  const [outlineState, setOutlineState] = useOutlineState();
  const title = outlineState.focusItem.text;
  const [menuVisible, setMenuVisible] = React.useState(false);
  const route = useRoute();
  const nav = useNav();
  /** @ts-ignore */
  const projectid = route.params?.project;

  let curIndex = 0;
  if (projectid != null) {
    let fullProjectId = `minderProject:${projectid}`;
    curIndex = projects.findIndex(p => p.id == fullProjectId);
  }
  useShortcut({
    key: 'ArrowDown',
    action: () => {
      if (!menuVisible) {
        setMenuVisible(true);
      }
    },
  });

  // These should probably go in a general util, but is fine here for now
  useShortcut({
    key: 'ArrowRight',
    action: () => nav.setParams({project: projectIdFor(curIndex + 1)}),
  });

  useShortcut({
    key: 'ArrowLeft',
    action: () => nav.setParams({project: projectIdFor(curIndex - 1)}),
  });

  function select(project: MinderProject) {
    setMenuVisible(false);
    nav.setParams({project: project.id.replace(/^minderProject:/, '')});
  }

  function projectIdFor(index: number) {
    const bounded = Math.max(0, Math.min(index, projects.length - 1));
    return projects[bounded].id.replace(/^minderProject:/, '');
  }

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <TouchableHighlight onPress={() => setMenuVisible(true)}>
          <Text style={style} numberOfLines={1}>
            {title}
          </Text>
        </TouchableHighlight>
      }>
      {projects.map(project => (
        <Menu.Item
          key={project.id}
          onPress={() => select(project)}
          title={project.name}
        />
      ))}
    </Menu>
  );
}

// TODO: Use new load() primitives
OutlineFocusPicker.load = async () => {
  const minderStore = useMinderStore();
  const projects = await minderStore.getProjects();
  return {projects};
};

export default withAsyncLoad(OutlineFocusPicker);
