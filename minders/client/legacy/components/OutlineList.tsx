// @flow

import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import type {SelectionChangeEvent} from 'react-native/Libraries/components/TextInput/TextInput';
import {List} from 'react-native-paper';
import Outliner, {
  pathTo,
  hasVisibleKids,
  type OutlineItem,
  isChild,
  getChildren,
} from '../model/outliner';
import * as OutlineState from '../model/OutlineState';
import {EditableStatus} from './EditableStatus';
import OutlineStyles from './OutlineStyles';
import OutlinerContext, {
  useOutlineState,
  itemContext,
  useOutliner,
} from './OutlinerContext';
import OutlineUtil from './OutlineUtil';
import ActionMenu, {VerticalDots} from './ActionMenu';
import {Bump, Snooze, Delete, Mover} from './Actions';
import ScrollViewWithTitle from './ScrollViewWithTitle';
import type {
  TextStyleProp,
  ViewStyleProp,
} from 'react-native/Libraries/StyleSheet/StyleSheet';
import {NoChildren} from './OutlineTop';
import {useShortcut} from './Shortcuts';
import {useForceUpdate} from './Useful';
import {ThemeProvider} from '@react-navigation/native';

function cursorStyle(cursor): TextStyleProp {
  // $FlowExpectedError
  return {cursor};
}

function lastChild(item: OutlineItem) {
  const kids = getChildren(item);
  return kids[kids.length - 1];
}

export function OutlineListItem(props: {
  item: OutlineItem,
  listItem?: OutlineItem,
  prev?: OutlineItem,
  style?: ViewStyleProp,
}) {
  const {item, listItem, prev, style} = props;
  const outliner = useOutliner();
  const [text, setText] = React.useState(item.text);
  OutlineUtil.useRedrawOnItemUpdate(item.id);

  const isSel = OutlineState.isSelected(item);
  const selection = isSel ? OutlineState.getSelection() : {start: 0, end: 0};
  const cursor = isSel ? null : 'default';
  const ctx = itemContext(item);
  const inputRef = React.useRef();
  const forceUpdate = useForceUpdate();

  function backspace() {
    if (text == '' && isChild(item)) {
      outliner.deleteItem(item);
      if (prev) {
        OutlineState.setSelection(prev, {
          start: prev.text.length,
          end: prev.text.length,
        });
      } else {
        OutlineState.clearSelection();
      }
      listItem && outliner.touch(listItem);
      return false;
    }
    return true;
  }

  function enter() {
    var beforeText = text.substring(0, selection.start) || '';
    var afterText = text.substring(selection.start) || '';
    setText(beforeText);
    const after = listItem || item;
    outliner.createItemAfter(lastChild(after), afterText);
    listItem && outliner.touch(listItem);
    return false;
  }

  function submit() {}

  useShortcut({key: 'Backspace', action: backspace, inText: true}, isSel);
  useShortcut({key: 'Enter', action: enter, shift: false, inText: true}, isSel);
  useShortcut({key: 'Enter', action: submit, shift: true, inText: true}, isSel);

  function onSelectionChange(e: SelectionChangeEvent) {
    OutlineState.setSelection(item, {...e.nativeEvent.selection});
    // There should be a better way here but we don't want to trigger
    // all updates on this item
    forceUpdate();
  }

  function commit() {
    if (OutlineState.isSelected(item)) {
      OutlineState.clearSelection();
    }
    outliner.updateOutlineItem(item, {text});
  }

  function focus() {
    if (!OutlineState.isSelected(item)) {
      OutlineState.setSelection(item);
    }
  }

  function setInput(input) {
    if (input && isSel) {
      input.focus();
    }
    inputRef.current = input;
  }

  function submit() {
    // Just blur it
    inputRef.current?.blur();
  }

  return (
    <OutlinerContext.Provider value={ctx}>
      <View style={[styles.listItem, style]}>
        <View>
          <EditableStatus size={18} item={item} style={styles.indicator} />
        </View>
        <View style={{flex: 1, paddingLeft: 2, alignSelf: 'center'}}>
          <TextInput
            value={text}
            style={[styles.listItemText, cursorStyle(cursor)]}
            onChangeText={(val) => setText(val)}
            onBlur={commit}
            onFocus={focus}
            onSubmitEditing={commit}
            onSelectionChange={onSelectionChange}
            selection={selection}
            ref={setInput}
          />
          <Text style={styles.parent}>{pathTo(outliner, item.parent)}</Text>
        </View>
        <View style={{justifyContent: 'flex-end'}}>
          <ActionMenu
            actions={[Snooze, Bump, Mover, Delete]}
            anchor={(onPress) => (
              <VerticalDots style={styles.actionsR} onPress={onPress} />
            )}
          />
        </View>
      </View>
    </OutlinerContext.Provider>
  );
}

//const OutlineListItemMemo = React.memo(OutlineListItem);

function stableishList(newItems: OutlineItem[], oldItems: OutlineItem[]) {
  if (newItems.length == oldItems.length) {
    const diff = newItems.filter((item) => oldItems.indexOf(item) == -1);
    if (diff.length == 0) {
      return oldItems;
    }
  }

  if (newItems.length == oldItems.length + 1) {
    const added = newItems.filter((item) => oldItems.indexOf(item) == -1);
    if (added.length == 1) {
      oldItems.push(added[0]);
      return oldItems;
    }
  } else if (newItems.length == oldItems.length - 1) {
    const removed = oldItems.filter((item) => newItems.indexOf(item) == -1);
    if (removed.length == 1) {
      const idx = oldItems.indexOf(removed[0]);
      oldItems.splice(idx, 1);
      return oldItems;
    }
  }
  return newItems;
}

export default function OutlineList(props: {}) {
  const outliner = useOutliner();

  const [outlineState] = useOutlineState();
  const topItem = outlineState.focusItem;
  const outlineItems = outliner
    .getFlatList(topItem)
    .filter((item) => !item.ui?.hidden);

  // Both options aren't great here
  // With [] it stays stable until invalidates parent, and then
  // makes huge change. Also possibly items not in current view *should* go away
  // With map, events were firing on every key down,
  // And the lack of stability was possibly annoying
  // Ideally we want a hook when items might change visibility, not otherwise
  const itemIdsToListen = outlineItems.map((item) => item.id); // = []
  itemIdsToListen.push(topItem.id);
  OutlineUtil.useRedrawOnItemUpdate(itemIdsToListen);

  // Keep stable ordering when one item is added or removed
  const prevItems = React.useRef(outlineItems);
  const orderedItems = stableishList(outlineItems, prevItems.current);
  prevItems.current = orderedItems;

  if (!hasVisibleKids(topItem)) {
    return <NoChildren item={topItem} />;
  }

  return (
    <View style={{height: 500}}>
      {orderedItems.map((item, idx) => (
        <OutlineListItem
          item={item}
          listItem={topItem}
          prev={outlineItems[idx - 1]}
          key={item.id}
          style={idx % 2 == 1 && styles.odd}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listItem: {
    padding: 5,
    flexWrap: 'nowrap',
    backgroundColor: '#FFF',
    flexDirection: 'row',
  },
  odd: {
    backgroundColor: '#F0F0F0',
  },
  listItemTitle: {
    fontFamily: OutlineStyles.fontFamily,
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
  },
  parent: {
    fontSize: 10,
    opacity: 0.5,
  },
  listItemText: {
    fontSize: 16,
    opacity: 0.85,
    fontWeight: '500',
  },
  listItemDescription: {
    fontFamily: OutlineStyles.fontFamily,
    paddingTop: 4,
    fontSize: 13,
    fontWeight: 'bold',
    opacity: 0.75,
  },
  indicator: {
    opacity: 0.4,
    /* marginVertical: 12,*/
  },
  actionsR: {
    opacity: 0.4,
    marginHorizontal: 0,
    marginLeft: -6,
    marginRight: 6,
  },
});
