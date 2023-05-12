/**
 * @format
 */

import * as React from 'react';
import {StyleProp, Text, TextStyle, TouchableHighlight} from 'react-native';
import {useOutlineState, useOutliner} from '../model/OutlinerContext';
import {OutlineItem} from '../model/outliner';
import {useShortcut} from '../util/Shortcuts';
import {Menu} from './AppComponents';

function OutlineFocusPicker(props: {style?: StyleProp<TextStyle>}) {
  const {style} = props;
  const outliner = useOutliner();
  const [outlineState, setOutlineState] = useOutlineState();
  const title = outlineState.focusItem.text;
  const [menuVisible, setMenuVisible] = React.useState(false);
  const items = outliner.getTopItems(true);
  const curIndex = items.indexOf(outlineState.focusItem);

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
    action: () => {
      const toFocus =
        curIndex == -1 || curIndex == items.length - 1 ? 0 : curIndex + 1;
      setOutlineState({focus: items[toFocus].id});
    },
  });
  useShortcut({
    key: 'ArrowLeft',
    action: () => {
      const toFocus =
        curIndex == -1 || curIndex == 0 ? items.length - 1 : curIndex - 1;
      setOutlineState({focus: items[toFocus].id});
    },
  });

  function focusSelected(item: OutlineItem) {
    setMenuVisible(false);
    setTimeout(() => setOutlineState({focus: item.id}), 0);
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
      {items.map((item, idx) => {
        return (
          <Menu.Item
            key={item.id}
            onPress={() => focusSelected(item)}
            title={item.text}
          />
        );
      })}
    </Menu>
  );
}

export default OutlineFocusPicker;