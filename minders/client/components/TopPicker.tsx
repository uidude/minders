/**
 * @format
 */

import * as React from 'react';
import {StyleProp, Text, TextStyle, TouchableHighlight} from 'react-native';
import {useNav} from '@toolkit/ui/screen/Nav';
import {MinderProject, useMinderStore} from '@app/common/MinderApi';
import {useLoad, withLoad} from '@app/util/UseLoad';
import {useShortcut} from '../util/Shortcuts';
import {Menu} from './AppComponents';

type Props = {
  style?: StyleProp<TextStyle>;
  topId: string;
};

const TopPicker = (props: Props) => {
  const {style, topId} = props;
  const minderStore = useMinderStore();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const nav = useNav();
  const {projects, title, index} = useLoad(props, loadData);

  useShortcut({key: 'ArrowDown', action: showMenu});
  useShortcut({key: 'ArrowRight', action: right});
  useShortcut({key: 'ArrowLeft', action: left});

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
      {projects.map(p => (
        <Menu.Item key={p.id} onPress={() => select(p)} title={p.name} />
      ))}
    </Menu>
  );

  async function loadData() {
    const projects = await minderStore.getProjects();
    let index = -1;

    let title = '';
    if (topId!.indexOf('minder:') === 0) {
      const minder = (await minderStore.get(topId!))!;
      title = minder.text;
    } else {
      const foundIndex = projects.findIndex(p => p.id == topId);
      if (foundIndex !== -1) {
        index = foundIndex;
        title = projects[foundIndex].name;
      }
    }

    return {projects, title, index};
  }

  function showMenu() {
    if (!menuVisible) {
      setMenuVisible(true);
    }
  }
  function right() {
    nav.setParams({top: projectIdFor(index + 1)});
  }

  function left() {
    const newIndex = index === -1 ? projects.length - 1 : index - 1;
    nav.setParams({top: projectIdFor(newIndex)});
  }

  function select(project: MinderProject) {
    setMenuVisible(false);
    nav.setParams({top: project.id.replace(':', '>'), view: 'focus'});
  }

  function projectIdFor(index: number) {
    let newIndex = index % projects.length;
    if (newIndex < 0) {
      newIndex += projects.length;
    }
    return projects[newIndex].id.replace(':', '>');
  }
};

export default withLoad(TopPicker);
