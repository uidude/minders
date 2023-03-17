/**
 * @format
 */

import * as React from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {LayoutChangeEvent, StyleProp, ViewStyle} from 'react-native';
import {IconButton} from 'react-native-paper';
import {getChildren, getItemUi, isParent} from '../model/outliner';
import type {OutlineItem} from '../model/outliner';
import ActionButton from './ActionButton';
import ActionMenu, {VerticalDots} from './ActionMenu';
import {
  Bump,
  Delete,
  FocusOn,
  Indent,
  Mover,
  Outdent,
  Pin,
  Snooze,
  Unpin,
} from './Actions';
import {EditableStatus} from './EditableStatus';
import OutlineText from './OutlineText';
import OutlineUtil from './OutlineUtil';
import OutlinerContext, {itemContext, useOutliner} from './OutlinerContext';

function CollapserButton(props: {
  item: OutlineItem;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const {item, size, style} = props;
  const outliner = useOutliner();
  const closed = item.ui?.closed || false;

  const isDisabled = isParent(item) && item.ui?.kidsHidden;

  const toggleState = () => {
    if (!isDisabled) {
      outliner.updateOutlineItemUi(item, {closed: !closed});
    }
  };

  const icon = closed || isDisabled ? 'chevron-right' : 'chevron-down';

  return (
    <IconButton
      icon={icon}
      accessibilityLabel={closed ? 'Expand' : 'Collapse'}
      onPress={toggleState}
      style={style}
      size={size}
    />
  );
}

function Expando(props: {
  open: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const {open, children, style} = props;
  const [openState, setOpenState] = React.useState(open);
  const height = new Animated.Value(0);
  const contentHeightRef = React.useRef(0);
  const animating = open != openState;
  const renderChildren = openState || open;

  function checkAnimate() {
    if (animating && contentHeightRef.current != 0) {
      const contentHeight = contentHeightRef.current;
      height.setValue(openState ? contentHeight : 0);
      console.log('animating', contentHeightRef, open, openState);
      Animated.timing(height, {
        toValue: open ? contentHeight : 0,
        duration: Math.max(200 + 2 * contentHeight, 1200),
        easing: Easing.bounce,
        useNativeDriver: false,
      }).start(() => {
        setOpenState(open);
      });
    }
  }
  checkAnimate();

  function onContentLayout(e: LayoutChangeEvent) {
    contentHeightRef.current = e.nativeEvent.layout.height;
    checkAnimate();
  }

  return (
    <Animated.View style={[style, {height: animating ? height : undefined}]}>
      <View onLayout={onContentLayout}>{renderChildren && children}</View>
    </Animated.View>
  );
}

function ChildItems(props: {item: OutlineItem; level: number}) {
  const {item, level} = props;
  const subs = getChildren(item);
  OutlineUtil.useRedrawOnItemUpdate(item.id);

  /* Had style={{flexDirection: 'column'}} but was a dupe */
  return (
    <Expando open={!item.ui?.closed} style={{overflow: 'scroll'}}>
      {subs.map((sub, idx) => (
        <Hierarchy key={sub.id} item={sub} level={level + 1} />
      ))}
    </Expando>
  );
}

export default function Hierarchy(props: {item: OutlineItem; level?: number}) {
  const {item, level = 0} = props;
  const parental = isParent(item);
  OutlineUtil.useRedrawOnItemUpdate(item.id);

  const leftSpace = level * 18;
  let backgroundColor = null;

  const collapseStyle = [S.indicator, {marginLeft: leftSpace}];
  const lhIcons = parental ? (
    <>
      <ActionButton action={FocusOn} style={S.focus} />
      <CollapserButton size={18} item={item} style={collapseStyle} />
    </>
  ) : (
    <EditableStatus size={18} item={item} style={S.status} />
  );

  if (parental) {
    if (level == 0) {
      backgroundColor = '#D0D0D0';
    }
  }

  const isDisabled = parental && item.ui?.kidsHidden;

  /* Had backgroundColor: backgroundColor, but was dupe */
  const extraStyle = {
    paddingLeft: parental ? 0 : leftSpace + 32,
    opacity: isDisabled ? 0.5 : undefined,
    backgroundColor: parental ? '#F0F0F0' : undefined,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: parental ? '#E0E0E0' : '#FFF',
  };

  const actions = [Bump, Mover, Indent, Outdent, Delete];

  if (parental) {
    actions.unshift(Pin);
  } else {
    actions.unshift(Snooze);
  }

  if (item.ui?.hidden) {
    return <></>;
  }

  return (
    <OutlinerContext.Provider value={itemContext(item)}>
      <View style={[S.listItem, extraStyle]}>
        <View style={S.leftIcons}>{lhIcons}</View>
        <OutlineText
          backgroundColor={backgroundColor}
          textColor={level === 0 ? '#404040' : undefined}
          item={item}
        />
        <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
          {item.pinned && <ActionButton action={Unpin} style={S.pin} />}
          <ActionMenu
            actions={actions}
            anchor={onPress => (
              <VerticalDots style={S.actionsR} onPress={onPress} />
            )}
          />
        </View>
      </View>
      {!isDisabled && <ChildItems item={item} level={level} />}
    </OutlinerContext.Provider>
  );
}

const S = StyleSheet.create({
  listItem: {
    marginVertical: 0,
    padding: 2,
    paddingVertical: 0,
    flexWrap: 'nowrap',
    flexDirection: 'row',
  },
  indicator: {
    opacity: 0.4,
    marginHorizontal: 0,
  },
  status: {
    opacity: 0.4,
  },
  focus: {
    opacity: 0.4,
    marginHorizontal: 0,
    padding: 0,
  },
  actions: {
    opacity: 0.4,
  },
  actionsR: {
    opacity: 0.4,
    marginHorizontal: 0,
    marginLeft: -6,
    marginRight: 6,
  },
  pin: {
    opacity: 0.4,
    marginHorizontal: 0,
    marginLeft: -6,
    marginRight: 6,
    paddingTop: 3,
  },
  leftIcons: {
    marginHorizontal: 6,
    zIndex: 20,
    flexDirection: 'row',
  },
});
