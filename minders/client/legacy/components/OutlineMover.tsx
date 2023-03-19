/**
 * @format
 */

import * as React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {IconButton, Subheading} from 'react-native-paper';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {Opt} from '@toolkit/core/util/Types';
import {useNav} from '@toolkit/ui/screen/Nav';
import {getChildren, isParent, type OutlineItem} from '../model/outliner';
import {useOutliner} from './OutlinerContext';

function getTree(item: Opt<OutlineItem>) {
  const tree = [];
  while (item != null) {
    tree.unshift(item);
    item = item.parent;
  }
  return tree;
}

function canOpen(item: OutlineItem, focus: OutlineItem) {
  const children = getChildren(item);
  let canBeOpened = false;

  children.forEach(child => {
    if (isParent(child) && focus != child) {
      canBeOpened = true;
    }
  });
  return canBeOpened;
}

type Props = {
  focus: number;
};

const OutlineMover = (props: Props) => {
  requireLoggedInUser();
  const outliner = useOutliner();
  const nav = useNav();

  const focus: OutlineItem = outliner.getItem(props.focus, outliner.getData());
  if (focus.parent == null) {
    throw new Error("Can't move top level");
  }
  const [sel, setSel] = React.useState<OutlineItem>(focus.parent);
  const itemTree = getTree(sel);

  function rowStyle(indent: number): StyleProp<ViewStyle> {
    return [S.row, {paddingLeft: indent * 20}];
  }

  const selectableKids = getChildren(sel).filter(
    cur => cur != focus && isParent(cur),
  );

  function moveTo(to: OutlineItem) {
    outliner.move(focus, to);
    nav.back();
  }

  const len = itemTree.length;
  const Row = TouchableOpacity;

  // Currently only allow adding as child to an existing parent,
  // but we could relax this in future.
  return (
    <View>
      <View style={[rowStyle(0), {marginLeft: 14}]}>
        <Subheading>Where would you like to move this item?</Subheading>
      </View>
      {itemTree.map((item, idx) => (
        <Row key={item.id} style={rowStyle(idx)} onPress={() => setSel(item)}>
          <MoveIt onPress={() => moveTo(item)} />
          <IconButton icon="chevron-down" size={18} />
          <Text>{item.text}</Text>
        </Row>
      ))}
      {selectableKids.map((item, idx) =>
        canOpen(item, focus) ? (
          <Row key={item.id} style={rowStyle(len)} onPress={() => setSel(item)}>
            <IconButton
              icon="arrow-top-right"
              size={18}
              style={{position: 'absolute', right: 20}}
            />
            <MoveIt onPress={() => moveTo(item)} />
            <IconButton icon="chevron-right" size={18} />
            <Text>{item.text}</Text>
          </Row>
        ) : (
          <View key={item.id} style={rowStyle(len)}>
            <MoveIt onPress={() => moveTo(item)} />
            <IconButton icon="checkbox-blank-circle-outline" size={18} />
            <Text>{item.text}</Text>
          </View>
        ),
      )}
    </View>
  );
};

const MoveIt = (props: {onPress: () => void}) => {
  return (
    <IconButton
      icon="arrow-top-right"
      size={18}
      style={{position: 'absolute', right: 20}}
      onPress={props.onPress}
    />
  );
};

const S = StyleSheet.create({
  row: {
    padding: 5,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
});

export default OutlineMover;
