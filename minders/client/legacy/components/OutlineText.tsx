// @flow
// TODO: Extend text input props

import * as React from 'react';
import {useRef, useEffect, useContext} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  TextInput as NativeTextInput,
  TouchableOpacity,
} from 'react-native';
import {withTheme, Theme, TextInput, RenderProps} from 'react-native-paper';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';
import type {
  KeyPressEvent,
  SelectionChangeEvent,
} from 'react-native/Libraries/components/TextInput/TextInput';
import type {OutlineItem} from '../model/outliner';
import {isChild, isParent} from '../model/outliner';
import OutlinerContext, {useOutliner} from './OutlinerContext';
import {useAction, FocusOn} from './Actions';
import * as OutlineState from '../model/OutlineState';
//import {TouchableHighlight} from 'react-native-web';
import {useForceUpdate} from './Useful';

export type Selection = {
  start: number,
  end: number,
};

type KeyHandler = {
  key: string,
  shift?: boolean,
  action: () => ?boolean,
};

function OutlineText(props: {
  placeholder?: string,
  /*value?: string,*/
  style: ViewStyleProp,
  backgroundColor?: ?string,
  theme?: Theme,
  item: OutlineItem,
  /*focus?: boolean,*/
  textColor?: ?string,
}) {
  const {theme, item, style} = props;
  let [value, setValueState] = React.useState(item.text || '');
  const [editable, setEditableState] = React.useState(startsEditable());
  /*const focus = React.useRef(props.focus);*/
  const outliner = useOutliner();
  const focusMe = OutlineState.isSelected(item);
  const focusItem = useAction(FocusOn);
  const forceUpdate = useForceUpdate();
  //const backgroundColor = props.backgroundColor || '#FFF';
  //const borderStyle = { borderColor: focus ? '#88F' : backgroundColor };

  let textInput: TextInput;
  const selection = focusMe ? OutlineState.getSelection() : {start: 0, end: 0};

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

  function onBackspace(): ?boolean {
    if (value == '' && isChild(item)) {
      outliner.deleteItem(item);
      return false;
    }
  }

  function onEnter() {
    var beforeText = value.substring(0, selection.start) || '';
    var afterText = value.substring(selection.start) || '';
    setValue(beforeText);
    outliner.createItemAfter(item, afterText);
  }

  function onSubmit() {
    textInput?.blur();
  }

  const keyHandlers: KeyHandler[] = [
    {key: 'Tab', shift: false, action: onTab},
    {key: 'Tab', shift: true, action: onShiftTab},
    {key: 'Backspace', action: onBackspace},
    {key: 'Enter', shift: false, action: onEnter},
    {key: 'Enter', shift: true, action: onSubmit},
    {key: 'Escape', action: onSubmit},
  ];

  function applies(val?: boolean, match: boolean) {
    return val === undefined || match === val;
  }

  function handleKeyEvent(e: any, keyDownPhase) {
    // Only handle Tabs in keydown (to prevent default)
    if (keyDownPhase != (e.key == 'Tab' || e.key == 'Backspace')) {
      return;
    }
    for (const handler of keyHandlers) {
      if (e.key == handler.key && applies(handler.shift, e.shiftKey)) {
        if (handler.action() === false) {
          e.stopPropagation();
          e.preventDefault();
        }
      }
    }
  }

  function onKeyDown(e) {
    handleKeyEvent(e, true);
  }

  React.useEffect(() => {
    if (editable) {
      if (window && window.document) {
        window.document.addEventListener('keydown', onKeyDown, true);
        return () =>
          window.document.removeEventListener('keydown', onKeyDown, true);
      }
    }
  });

  const setTextInput = (component) => {
    if (component) {
      textInput = component;

      //if (focus.current) {
      // All calls be idempotent for multiple renders of same item
      if (focusMe) {
        textInput.focus();
        setEditable(true);
      }
    }
  };

  function startsEditable() {
    return Platform.OS == 'android';
  }

  function onBlur() {
    setEditable(false);
    const trimmed = value.trim();
    if (OutlineState.isSelected(item)) {
      OutlineState.clearSelection();
    }
    outliner.updateOutlineItem(item, {state: item.state, text: value});
    setValue(trimmed);
  }

  function onFocus() {
    setEditable(true);
  }

  function setEditable(value: boolean) {
    if (Platform.OS != 'android') {
      setEditableState(value);
    }
  }

  function selectIfNotAlready() {
    if (!OutlineState.isSelected(item)) {
      OutlineState.setSelection(item);
      setEditable(true);
    }
  }

  function onPress() {
    selectIfNotAlready();
  }

  function onLongPress() {
    if (isParent(item)) {
      focusItem();
    }
  }

  function onKeyPress(e: KeyPressEvent) {
    e.stopPropagation();
    e.preventDefault();
    return handleKeyEvent(e, false);
  }

  function onSelectionChange(e: SelectionChangeEvent) {
    if (editable) {
      OutlineState.setSelection(item, {...e.nativeEvent.selection});
      // There should be a better way here but we don't want to trigger
      // all updates on this item
      forceUpdate();
    }
  }

  const cursor = editable ? null : 'default';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={style}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <TextInput
        ref={setTextInput}
        editable={editable}
        value={value}
        dense={true}
        onChangeText={(value) => {
          setValue(value);
          return false;
        }}
        onKeyPress={onKeyPress}
        onBlur={onBlur}
        placeholder="What's your plan? "
        underlineColor="rgba(0,0,0,0)"
        onFocus={onFocus}
        render={(props) => {
          const {style, ...otherProps} = props;
          return (
            <View>
              <NativeTextInput
                {...otherProps}
                style={[style, {cursor}, {paddingLeft: 0}]}
              />
            </View>
          );
        }}
        style={{
          borderWidth: 0,
          backgroundColor: 'rgba(0,0,0,0)',
        }}
        onSelectionChange={onSelectionChange}
        selection={selection}
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

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 4,
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 4,
    flexGrow: 1,
  },
});

//export default withTheme(EditableText);
export default OutlineText;
