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
  t?: string;
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
    <Expando
      t={item?.text}
      open={!item.ui?.closed}
      style={{overflow: 'hidden'}}>
      {subs.map((sub, idx) => (
        <Hierarchy key={sub.id} item={sub} level={level + 1} index={idx} />
      ))}
    </Expando>
  );
}

export default function Hierarchy(props: {
  item: OutlineItem;
  level?: number;
  index?: number;
}) {
  const {item, level = 0, index = 0} = props;
  const subs = getChildren(item);
  const parental = isParent(item);
  const outliner = useOutliner();
  OutlineUtil.useRedrawOnItemUpdate(item.id);

  const paddingLeft = level * 24;
  let backgroundColor = null;
  let extraTitleStyle = null;

  const collapseStyle = [styles.indicator, {marginLeft: paddingLeft + 6}];
  const lhIcons = parental ? (
    <>
      <ActionButton action={FocusOn} style={styles.focus} />
      <CollapserButton size={18} item={item} style={collapseStyle} />
    </>
  ) : (
    <EditableStatus size={18} item={item} style={styles.status} />
  );

  if (parental) {
    if (level == 0) {
      backgroundColor = '#D0D0D0';
      extraTitleStyle = styles.firstTitle;
    }
  }

  const isDisabled = parental && item.ui?.kidsHidden;

  /* Had backgroundColor: backgroundColor, but was dupe */
  const extraStyle = {
    paddingLeft: parental ? 0 : paddingLeft + 26,
    opacity: isDisabled ? 0.5 : undefined,
    backgroundColor: parental ? '#F0F0F0' : undefined,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: parental ? '#E0E0E0' : '#FFF',
  };

  const ui = getItemUi(item);
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
      <View style={[styles.listItem, extraStyle]}>
        <View style={{marginLeft: 5, zIndex: 20, flexDirection: 'row'}}>
          {lhIcons}
        </View>
        <OutlineText
          style={{flexGrow: 1}}
          backgroundColor={backgroundColor}
          textColor={level === 0 ? '#404040' : undefined}
          item={item}
        />
        <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
          {item.pinned && <ActionButton action={Unpin} style={styles.pin} />}
          <ActionMenu
            actions={actions}
            anchor={onPress => (
              <VerticalDots style={styles.actionsR} onPress={onPress} />
            )}
          />
        </View>
      </View>
      {!isDisabled && <ChildItems item={item} level={level} />}
    </OutlinerContext.Provider>
  );
}

const styles = StyleSheet.create({
  listItem: {
    marginVertical: 0,
    padding: 2,
    paddingVertical: 0,
    flexWrap: 'nowrap',
    flexDirection: 'row',
  },
  firstTitle: {
    /* color: '#FFF', */
    fontWeight: 'bold',
  },
  indicator: {
    opacity: 0.4,
  },
  status: {
    opacity: 0.4,
    marginLeft: 2,
  },
  focus: {
    opacity: 0.4,
    marginLeft: 0,
    marginRight: -10,
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
});