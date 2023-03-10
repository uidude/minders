/**
 * @format
 */

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {getChildren, hasVisibleKids, type OutlineItem} from '../model/outliner';
import Hierarchy from './Hierarchy';
import {Filters} from './OutlineFrame';
import OutlineUtil from './OutlineUtil';
import {useOutlineState, useOutliner} from './OutlinerContext';

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
