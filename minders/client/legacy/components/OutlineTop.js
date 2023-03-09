// @flow

import React, {useContext, useState} from 'react';
import {Text, View, StyleSheet, TextInput} from 'react-native';
import Outliner, {
  getChildren,
  outlineSort,
  hasVisibleKids,
  type OutlineItem,
} from '../model/outliner';
import OutlinerContext, {useOutlineState, useOutliner} from './OutlinerContext';
import OutlineUtil from './OutlineUtil';
import Hierarchy from './Hierarchy';
import ScrollViewWithTitle from './ScrollViewWithTitle';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Filters} from './OutlineFrame';

export default function OutlineTop() {
  const outliner = useOutliner();
  const [outlineState] = useOutlineState();
  const topItem = outlineState.focusItem;
  const topChildren =
    topItem == outliner.getData()
      ? outliner.getTopItems(false)
      : getChildren(topItem);

  OutlineUtil.useRedrawOnItemUpdate(topItem.id);

  // Sort kids, but only when leaving this view
  // (note: this is hacky, probably need something more like
  // a stability lock in the future)
  // Disabling for now, feeling wonky... it's sorting
  // after adding an item to the outline view
  // React.useEffect(() => () => outliner.sortChildren(topItem));

  if (!hasVisibleKids(topItem)) {
    return <NoChildren item={topItem} />;
  }

  return (
    <View style={{height: 0}}>
      <View style={styles.frame}>
        {topChildren.map((item, index) => (
          <Hierarchy item={item} key={item.id} index={index} />
        ))}
      </View>
    </View>
  );
}

export function NoChildren(props: {item: OutlineItem}) {
  const {item} = props;
  const [outlineState] = useOutlineState();
  return (
    <View style={{margin: 30}}>
      <Text>
        {getChildren(item).length} items in "{item.text}", but none of them are
        visible in {Filters.get(outlineState.filter)?.label}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#123',
  },
});
