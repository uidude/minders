/**
 * @format
 */
// TODO: Extend text input props

import * as React from 'react';
import {
  NativeSyntheticEvent,
  TextInput as NativeTextInput,
  Platform,
  StyleSheet,
  TextInputKeyPressEventData,
  TextInputSelectionChangeEventData,
  TouchableOpacity,
  View,
} from 'react-native';
import {TextInput, Theme} from 'react-native-paper';
import {useAction} from '@toolkit/core/client/Action';
import {Opt} from '@toolkit/core/util/Types';
import * as OutlineState from '../model/OutlineState';
import {useOutliner} from '../model/OutlinerContext';
import type {OutlineItem} from '../model/outliner';
import {isChild, isParent} from '../model/outliner';
import {textInputSelect} from '../util/Useful';
import {useItemActions} from './Actions';

export type Selection = {
  start: number;
  end: number;
};

type KeyHandler = {
  key: string;
  shift?: boolean;
  action: () => boolean | void;
};

function OutlineText(props: {
  placeholder?: string;
  backgroundColor?: Opt<string>;
  theme?: Theme;
  item: OutlineItem;
  textColor?: string;
}) {
  const {item} = props;
  let [value, setValueState] = React.useState(item.text || '');
  const [active, setActive] = React.useState(false);
  const outliner = useOutliner();
  const {FocusOn} = useItemActions(item);
  const [focusItem] = useAction(FocusOn.action);
  const inputRef = React.useRef<NativeTextInput>();

  function setValue(newValue: string) {
    // Sets internal value first so onBlur() or other
    // methods called before redraw get correct value
    value = newValue;
    setValueState(newValue);
  }

  function onTab(): boolean {
    outliner.updateOutlineItem(item, {text: value}, true);
    outliner.nest(item);
    return false;
  }

  function onShiftTab(): boolean {
    outliner.updateOutlineItem(item, {text: value}, true);
    outliner.unnest(item);
    return false;
  }

  function onBackspace(): boolean | void {
    if (value == '' && isChild(item)) {
      outliner.deleteItem(item);
      return false;
    }
  }

  function onEnter() {
    const selection = OutlineState.getSelection();
    var beforeText = value.substring(0, selection.start) || '';
    var afterText = value.substring(selection.start) || '';
    setValue(beforeText);
    outliner.createItemAfter(item, afterText);
  }

  function onSubmit() {
    inputRef.current?.blur();
  }

  const keyHandlers: KeyHandler[] = [
    {key: 'Tab', shift: false, action: onTab},
    {key: 'Tab', shift: true, action: onShiftTab},
    {key: 'Backspace', action: onBackspace},
    {key: 'Enter', shift: false, action: onEnter},
    {key: 'Enter', shift: true, action: onSubmit},
    {key: 'Escape', action: onSubmit},
  ];

  function applies(val: Opt<boolean>, match: boolean) {
    return val === undefined || match === val;
  }

  function handleKeyEvent(e: any, keyDownPhase: any) {
    const web = Platform.OS === 'web';
    // Need to prevent default on keydown for these keys
    if (keyDownPhase != (e.key == 'Tab' || e.key == 'Backspace')) {
      if (web) {
        return;
      }
    }
    for (const handler of keyHandlers) {
      if (e.key == handler.key && applies(handler.shift, e.shiftKey)) {
        if (handler.action() === false && web) {
          e.stopPropagation();
          e.preventDefault();
        }
      }
    }
  }

  function onKeyDown(e: any) {
    handleKeyEvent(e, true);
  }

  React.useEffect(() => {
    if (active) {
      if (window && window.document) {
        window.document.addEventListener('keydown', onKeyDown, true);
        return () =>
          window.document.removeEventListener('keydown', onKeyDown, true);
      }
    }
  });

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

  const setInput = (input: NativeTextInput) => {
    inputRef.current = input;
    if (input && OutlineState.isSelected(item)) {
      if (active) {
        checkNewSelection();
      } else {
        input.focus();
      }
    }
  };

  function onFocus() {
    checkNewSelection();
    OutlineState.setSelection(item);
    setActive(true);
  }

  function onBlur() {
    OutlineState.clearSelection();
    setActive(false);
    const trimmed = value.trim();
    outliner.updateOutlineItem(item, {state: item.state, text: trimmed});
    setValue(trimmed);
  }

  function onLongPress() {
    if (isParent(item)) {
      focusItem();
    }
  }

  function onKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    return handleKeyEvent(e.nativeEvent, false);
  }

  function onSelectionChange(
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) {
    if (active) {
      OutlineState.setSelection(item, {...e.nativeEvent.selection});
    }
  }
  // Needed for extra web style
  const cursor: any = {cursor: active ? null : 'default'};

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{flex: 1}}
      onLongPress={onLongPress}>
      <TextInput
        value={value}
        dense={true}
        onChangeText={value => setValue(value)}
        onKeyPress={onKeyPress}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="What's your plan?"
        activeUnderlineColor="rgba(0,0,0,0)"
        underlineColor="rgba(0,0,0,0)"
        selectTextOnFocus={true}
        render={props => {
          const {style, ...otherProps} = props;
          return (
            <View style={S.textInputHolder}>
              <NativeTextInput
                {...otherProps}
                ref={setInput}
                style={[style, {paddingLeft: 0, textAlign: 'auto'}, cursor]}
              />
            </View>
          );
        }}
        style={{
          borderWidth: 0,
          backgroundColor: 'rgba(0,0,0,0)',
        }}
        onSelectionChange={onSelectionChange}
        theme={{
          colors: {
            text: props.textColor,
            primary: '#080',
          },
        }}
      />
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  textInputHolder: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

//export default withTheme(EditableText);
export default OutlineText;
