/**
 * @format
 */

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {Screen} from '@toolkit/ui/screen/Screen';
import {Filters} from '@app/AppLayout';
import OutlineUtil from '@app/model/OutlineUtil';
import Hierarchy from '../components/Hierarchy';
import {useOutlineState, useOutliner} from '../model/OutlinerContext';
import {getChildren, hasVisibleKids, type OutlineItem} from '../model/outliner';

type Props = {
  focus?: number;
};

const OutlineTop: Screen<Props> = props => {
  requireLoggedInUser();
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
    <View style={S.frame}>
      {topChildren.map((item, index) => (
        <Hierarchy item={item} key={item.id} />
      ))}
    </View>
  );
};
OutlineTop.title = 'Minders';

export default OutlineTop;

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

const S = StyleSheet.create({
  frame: {
    flex: 1,
  },
});
