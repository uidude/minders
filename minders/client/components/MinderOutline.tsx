/**
 * @format
 */

import * as React from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {IconButton} from 'react-native-paper';
import {Opt} from '@toolkit/core/util/Types';
import {useIndent, useMinderActions, useOutdent} from '@app/components/Actions';
import {EditableStatusM} from '@app/components/EditableStatus';
import {
  Minder,
  OutlineItemVisibilityFilter,
  getChildren,
  hasVisibleKids,
  isParent,
  isVisible,
  useLiveData,
  useMinderStore,
} from '@app/model/Minders';
import {ActionButton} from './ActionButton';
import {ActionMenu, VerticalDots} from './ActionMenu';
import {MinderTextInput} from './MinderTextInput';

function CollapserButton(props: {
  minder: Minder;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const {size, style} = props;
  const minderStore = useMinderStore();
  const [minder] = useLiveData(Minder, [props.minder]);
  const closed = minder.collapsed ?? false;

  const isDisabled = isParent(minder) && !hasVisibleKids(minder);

  const toggleState = async () => {
    if (!isDisabled) {
      minderStore.update(minder, {collapsed: !closed});
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

type ChildItemProps = {
  parents: Minder[];
  minder: Minder;
  level: number;
  filter: OutlineItemVisibilityFilter;
};

function ChildItems(props: ChildItemProps) {
  const {level, filter} = props;
  const children = getChildren(props.minder).filter(m => isVisible(m, filter));
  const [minder] = useLiveData(Minder, [props.minder]);
  const open = !(minder.collapsed ?? false);
  const parents = [minder, ...props.parents];

  return (
    <Expando open={open} style={{overflow: 'scroll'}}>
      {children.map((child, idx) => (
        <MinderOutline
          key={child.id}
          minder={child}
          prev={children[idx - 1]}
          parents={parents}
          level={level + 1}
          filter={filter}
        />
      ))}
    </Expando>
  );
}

type MinderOutlineProps = {
  minder: Minder;
  prev: Opt<Minder>;
  parents?: Minder[];
  level?: number;
  filter: OutlineItemVisibilityFilter;
};

export default function MinderOutline(props: MinderOutlineProps) {
  const {minder, prev, filter, parents = [], level = 0} = props;
  const parental = isParent(minder);

  //OutlineUtil.useRedrawOnItemUpdate(item.id);
  const {Bump, Mover, Delete, Pin, Unpin, Snooze, FocusOn} =
    useMinderActions(minder);
  const Indent = useIndent(minder, prev);
  const Outdent = useOutdent(minder, parents[1]);

  const leftSpace = level * 18;
  let backgroundColor = null;

  const collapseStyle = [S.indicator, {marginLeft: leftSpace}];
  const lhIcons = parental ? (
    <>
      <ActionButton item={FocusOn} style={S.focus} />
      <CollapserButton size={18} minder={minder} style={collapseStyle} />
    </>
  ) : (
    <EditableStatusM size={18} minder={minder} style={S.status} />
  );

  if (parental) {
    if (level == 0) {
      backgroundColor = '#D0D0D0';
    }
  }

  const isDisabled = parental && !hasVisibleKids(minder);

  /* Had backgroundColor: backgroundColor, but was dupe */
  const extraStyle = {
    paddingLeft: parental ? 0 : leftSpace + 32,
    opacity: isDisabled ? 0.5 : undefined,
    backgroundColor: parental ? '#F0F0F0' : undefined,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: parental ? '#E0E0E0' : '#FFF',
  };

  const items = [parental ? Pin : Snooze, Bump, Mover, Indent, Outdent, Delete];

  return (
    <>
      <View style={[S.listItem, extraStyle]}>
        <View style={S.leftIcons}>{lhIcons}</View>
        <View style={S.textBox}>
          <MinderTextInput
            /* backgroundColor={backgroundColor} */
            /* textColor={level === 0 ? '#404040' : undefined} */
            minder={minder}
            prev={prev}
            mode="outline"
          />
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
          {/** item.pinned && <ActionButton item={Unpin} style={S.pin} />* **/}
          <ActionMenu
            items={items}
            anchor={onPress => (
              <VerticalDots style={S.actionsR} onPress={onPress} />
            )}
          />
        </View>
      </View>
      {!isDisabled && (
        <ChildItems
          minder={minder}
          parents={parents}
          level={level}
          filter={filter}
        />
      )}
    </>
  );
}

const S = StyleSheet.create({
  listItem: {
    marginVertical: 0,
    padding: 2,
    paddingVertical: 0,
    flexWrap: 'nowrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  textBox: {
    flexGrow: 1,
    flexBasis: 50,
    justifyContent: 'center',
  },
});
