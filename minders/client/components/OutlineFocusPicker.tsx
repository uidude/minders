/**
 * @format
 */

import * as React from 'react';
import {StyleProp, Text, TextStyle, TouchableHighlight} from 'react-native';
import {withAsyncLoad} from '@toolkit/core/util/Loadable';
import {Opt} from '@toolkit/core/util/Types';
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
    title: Opt<string>;
    projects: MinderProject[];
  };
};
function OutlineFocusPicker(props: Props) {
  const {style} = props;
  let {projects, title = ''} = props.async;
  const [menuVisible, setMenuVisible] = React.useState(false);
  const {top: topId} = useMinderListParams();
  const nav = useNav();

  let curIndex = -1;
  if (top != null) {
    const foundIndex = projects.findIndex(p => p.id == topId);
    if (foundIndex !== -1) {
      curIndex = foundIndex;
      title = projects[foundIndex].name;
    }
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
    action: () => nav.setParams({top: projectIdFor(curIndex + 1)}),
  });
  //nav.navTo(location.screen, {...location.params, top: newTop});
  useShortcut({
    key: 'ArrowLeft',
    // TODO: Left arrow from -1 == end of list
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
  const {top: topId} = useMinderListParams();

  const projects = await minderStore.getProjects();

  let title;
  if (topId.indexOf('minder:') === 0) {
    const minder = (await minderStore.get(topId))!;
    title = minder.text;
  }

  return {projects, title};
};

export default withAsyncLoad(OutlineFocusPicker);
