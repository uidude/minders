import * as OutlineState from '@app/model/OutlineState';
import OutlineUtil from '@app/model/OutlineUtil';
import {useOutliner} from '@app/model/OutlinerContext';
import {
  OutlineItem,
  getChildren,
  isChild
} from '@app/model/outliner';
import {useShortcut} from '@app/util/Shortcuts';
import {textInputSelect, useForceUpdate} from '@app/util/Useful';
import {Opt} from '@toolkit/core/util/Types';
import React from 'react';
import {
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputSelectionChangeEventData,
  TextStyle
} from 'react-native';


type Props =  {
  item: OutlineItem;
  top?: OutlineItem;
  prev?: OutlineItem;
}

/**
 * All of the logic for editing text inside an outline list item.
 * 
 * Includes logic for special characters
 * - Backspace deletes if no text remains
 * - Enter creates a new item
 * - Shift-enter submits the new item
 * 
 * Also includes logic for checking for current selection. This is
 * surprisingly complicated because you want to pick up the new selection
 * when another item is blurred or deleted, and this is not handled consistently
 * across different text inputs on different platforms.
 * 
 * Keeping side-by-side with OutlineText (the version for hierarchical display)
 * so we can hopefully unify.
 */
export function OutlineListTextInput(props: Props) {
  const {item, top, prev} = props;
  const outliner = useOutliner();
  const [value, setValue] = React.useState(item.text);
  const [active, setActive] = React.useState(false);
  OutlineUtil.useRedrawOnItemUpdate(item.id);
  const forceUpdate = useForceUpdate();

  const isSel = OutlineState.isSelected(item);
  const cursor = isSel ? null : 'default';
  const inputRef = React.useRef<TextInput>();

  function backspace() {
    if (value == '' && isChild(item)) {
      outliner.deleteItem(item, true, prev);
      top && outliner.touch(top);
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
    const after = top || item;
    outliner.createItemAfter(lastChild(after), afterText);
    top && outliner.touch(top);
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
  );
}

function cursorStyle(cursor: Opt<String>): StyleProp<TextStyle> {
  /** @ts-ignore */
  return {cursor};
}

function lastChild(item: OutlineItem) {
  const kids = getChildren(item);
  return kids[kids.length - 1];
}

const S = StyleSheet.create({
  listItemText: {
    fontSize: 16,
    opacity: 0.85,
    fontWeight: '500',
  },
});
