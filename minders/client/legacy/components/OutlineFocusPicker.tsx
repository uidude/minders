/**
 * @format
 */

import * as React from 'react';
import {Text, TouchableHighlight} from 'react-native';
import {Menu} from 'react-native-paper';
import {getChildren, isParent, type OutlineItem} from '../model/outliner';
import {useOutlineState, useOutliner} from './OutlinerContext';
import {useShortcut} from './Shortcuts';
import S from './Styles';

function OutlineFocusPicker() {
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
    // REVIEW: This was causing warning, worked without but wasn't clear
    // if we could rely on selecting closing
    // setMenuVisible(false);
    setTimeout(() => setOutlineState({focus: item.id}), 0);
  }

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      style={S.menu}
      contentStyle={S.menuContent}
      anchor={
        <TouchableHighlight onPress={() => setMenuVisible(true)}>
          <Text>{title}</Text>
        </TouchableHighlight>
      }>
      {items.map((item, idx) => {
        return (
          <Menu.Item
            key={item.id}
            onPress={() => focusSelected(item)}
            style={S.menuItem}
            title={item.text}
          />
        );
      })}
    </Menu>
  );
}

export default OutlineFocusPicker;
