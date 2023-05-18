/**
 * @format
 */

import * as React from 'react';
import {StyleProp, Text, TextStyle, TouchableHighlight} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {withAsyncLoad} from '@toolkit/core/util/Loadable';
import {useNav} from '@toolkit/ui/screen/Nav';
import {
  MinderProject,
  useMinderListParams,
  useMinderStore,
} from '@app/model/Minders';
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
  const [menuVisible, setMenuVisible] = React.useState(false);
  const nav = useNav();
  const {top: projectId} = useMinderListParams();

  let curIndex = 0;
  if (top != null) {
    const foundIndex = projects.findIndex(p => p.id == projectId);
    if (foundIndex !== -1) {
      curIndex = foundIndex;
    }
  }
  const title = projects[curIndex].name;

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
    action: () => nav.setParams({top: projectIdFor(curIndex + 1)}),
  });

  useShortcut({
    key: 'ArrowLeft',
    action: () => nav.setParams({top: projectIdFor(curIndex - 1)}),
  });

  function select(project: MinderProject) {
    setMenuVisible(false);
    nav.setParams({top: project.id.replace(':', '>')});
  }

  function projectIdFor(index: number) {
    let newIndex = index % projects.length;
    if (newIndex < 0) {
      newIndex += projects.length;
    }
    return projects[newIndex].id.replace(':', '>');
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
