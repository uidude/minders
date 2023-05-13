/**
 * @format
 */

import React from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {Opt} from '@toolkit/core/util/Types';
import {Screen} from '@toolkit/ui/screen/Screen';
import {ActionMenu, VerticalDots} from '@app/components/ActionMenu';
import {useItemActions} from '@app/components/Actions';
import OutlineUtil from '@app/model/OutlineUtil';
import {useOutlineState, useOutliner} from '@app/model/OutlinerContext';
import {EditableStatus} from '../components/EditableStatus';
import * as OutlineState from '../model/OutlineState';
import {
  getChildren,
  hasVisibleKids,
  isChild,
  pathTo,
  type OutlineItem,
} from '../model/outliner';
import {useShortcut} from '../util/Shortcuts';
import {textInputSelect, useForceUpdate} from '../util/Useful';
import {NoChildren} from './OutlineTop';

function cursorStyle(cursor: Opt<String>): StyleProp<TextStyle> {
  /** @ts-ignore */
  return {cursor};
}

function lastChild(item: OutlineItem) {
  const kids = getChildren(item);
  return kids[kids.length - 1];
}

export function OutlineListItem(props: {
  item: OutlineItem;
  listItem?: OutlineItem;
  prev?: OutlineItem;
  style?: StyleProp<ViewStyle>;
}) {
  const {item, listItem, prev, style} = props;
  const outliner = useOutliner();
  const [value, setValue] = React.useState(item.text);
  const [active, setActive] = React.useState(false);
  OutlineUtil.useRedrawOnItemUpdate(item.id);
  const forceUpdate = useForceUpdate();

  const isSel = OutlineState.isSelected(item);
  const cursor = isSel ? null : 'default';
  const inputRef = React.useRef<TextInput>();
  const {Snooze, Bump, Mover, Delete} = useItemActions(item);

  function backspace() {
    if (value == '' && isChild(item)) {
      outliner.deleteItem(item, true, prev);
      listItem && outliner.touch(listItem);
      forceUpdate();
      return false;
    }
    return true;
  }

  function enter() {
    const selection = OutlineState.getSelection();
    var beforeText = value.substring(0, selection.start) || '';
    var afterText = value.substring(selection.start) || '';
    setValue(beforeText);
    const after = listItem || item;
    outliner.createItemAfter(lastChild(after), afterText);
    listItem && outliner.touch(listItem);
    return false;
  }

  useShortcut({key: 'Backspace', action: backspace, inText: true}, isSel);
  useShortcut({key: 'Enter', action: enter, shift: false, inText: true}, isSel);
  useShortcut({key: 'Enter', action: submit, shift: true, inText: true}, isSel);

  function onSelectionChange(
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) {
    if (active) {
      OutlineState.setSelection(item, {...e.nativeEvent.selection});
    }
  }

  function checkNewSelection() {
    const newSelection = OutlineState.shouldSelectText(item);
    // We select twice to capture before and after the auto selection
    function selector() {
      if (newSelection && inputRef.current) {
        textInputSelect(inputRef.current, newSelection);
      }
    }
    selector();
    setTimeout(selector, 10);
  }

  function onBlur() {
    OutlineState.clearSelection();
    setActive(false);
    const trimmed = value.trim();
    outliner.updateOutlineItem(item, {state: item.state, text: trimmed});
    setValue(trimmed);
  }

  function onFocus() {
    checkNewSelection();
    OutlineState.setSelection(item);
    setActive(true);
  }

  const setInput = (input: TextInput) => {
    inputRef.current = input;
    if (input && OutlineState.isSelected(item)) {
      if (active) {
        checkNewSelection();
      } else {
        input.focus();
      }
    }
  };

  function submit() {
    // This will commit values
    inputRef.current?.blur();
  }

  return (
    <>
      <View style={[S.listItem, style]}>
        <EditableStatus size={18} item={item} style={S.indicator} />
        <View style={S.textContainer}>
          <TextInput
            value={value}
            style={[S.listItemText, cursorStyle(cursor)]}
            onChangeText={val => setValue(val)}
            onBlur={onBlur}
            onFocus={onFocus}
            onSubmitEditing={submit}
            onSelectionChange={onSelectionChange}
            ref={setInput}
            selectTextOnFocus={true}
          />
          <Text style={S.parent}>{pathTo(outliner, item.parent)}</Text>
        </View>
        <View>
          <ActionMenu
            items={[Snooze, Bump, Mover, Delete]}
            anchor={onPress => (
              <VerticalDots style={S.actionsR} onPress={onPress} />
            )}
          />
        </View>
      </View>
    </>
  );
}

function stableishList(newItems: OutlineItem[], oldItems: OutlineItem[]) {
  if (newItems.length == oldItems.length) {
    const diff = newItems.filter(item => oldItems.indexOf(item) == -1);
    if (diff.length == 0) {
      return oldItems;
    }
  }

  if (newItems.length == oldItems.length + 1) {
    const added = newItems.filter(item => oldItems.indexOf(item) == -1);
    if (added.length == 1) {
      oldItems.push(added[0]);
      return oldItems;
    }
  } else if (newItems.length == oldItems.length - 1) {
    const removed = oldItems.filter(item => newItems.indexOf(item) == -1);
    if (removed.length == 1) {
      const idx = oldItems.indexOf(removed[0]);
      oldItems.splice(idx, 1);
      return oldItems;
    }
  }
  return newItems;
}

type Props = {
  focus?: number;
};

const OutlineList: Screen<Props> = props => {
  requireLoggedInUser();
  const outliner = useOutliner();

  const [outlineState] = useOutlineState();
  const topItem = outlineState.focusItem;
  const outlineItems = outliner
    .getFlatList(topItem)
    .filter(item => !item.ui?.hidden);

  // Both options aren't great here
  // With [] it stays stable until invalidates parent, and then
  // makes huge change. Also possibly items not in current view *should* go away
  // With map, events were firing on every key down,
  // And the lack of stability was possibly annoying
  // Ideally we want a hook when items might change visibility, not otherwise
  const itemIdsToListen = outlineItems.map(item => item.id); // = []
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
    <View>
      {orderedItems.map((item, idx) => (
        <OutlineListItem
          item={item}
          listItem={topItem}
          prev={outlineItems[idx - 1]}
          key={item.id}
          style={idx % 2 == 1 && S.odd}
        />
      ))}
    </View>
  );
};
OutlineList.title = 'Minders';
OutlineList.id = 'OutlineList';

export default OutlineList;

function getFontFamily() {
  return Platform.select({
    ios: 'Futura',
    android: 'Roboto',
    web: 'Roboto, Arial',
  });
}

const S = StyleSheet.create({
  listItem: {
    padding: 5,
    flexWrap: 'nowrap',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  odd: {
    backgroundColor: '#F0F0F0',
  },
  listItemTitle: {
    fontFamily: getFontFamily(),
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
    fontFamily: getFontFamily(),
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
  textContainer: {
    flexBasis: 50,
    flexGrow: 1,
    paddingLeft: 2,
  },
});
