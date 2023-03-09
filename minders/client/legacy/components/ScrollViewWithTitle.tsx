// @flow

import React, {useContext, useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

export default function ScrollViewWithTitle(props: {
  title?: string,
  children?: any,
}) {
  const {title, children} = props;
  return (
    <View style={styles.all}>
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>{title || ''}</Text>
      </View>
      <ScrollView style={styles.container}>{children}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: '#123', // was 123
    height: 50,
    width: '100%',
    paddingLeft: 16,
  },
  topBarText: {
    fontSize: 28,
    color: '#FFF',
    textShadowColor: '#246',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
    lineHeight: 50,
    fontWeight: 'bold',
  },
  all: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: '#fff',
    overflow: 'scroll',
  },
});
