import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Markdown, {
  RenderRules,
  hasParents,
  renderRules,
} from 'react-native-markdown-display';
import {useComponents} from '@toolkit/ui/components/Components';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';

const TitleMarkdown = 'Welcome to Minders!';
const DescriptionMarkdown = `
The simplest, most relaxed way to track what **you** need to do. Minders are like a todo list, but better!
* **Keeps you focused**
  Default view shows only what you're working on
* **Create without losing context**
  Type or say just a few words to add to the future list
* **Snooze it**
  Hides Minders while you're waiting for other people or need to follow up in a few days
* **Junk drawer**
  Stale Minders go in a pile that you can revisit but mostly ignore

`;

const AboutScreen: Screen<{}> = () => {
  const {back} = useNav();
  const {Button} = useComponents();
  const {Body, Title} = useComponents();

  return (
    <View style={S.container}>
      <View>
        <Title style={S.title}>{TitleMarkdown}</Title>
        {/* @ts-ignore Markdown props don't have "children" yet */}
        <Markdown style={MARKDOWN_STYLE} rules={MARKDOWN_RULES}>
          {DescriptionMarkdown}
        </Markdown>
      </View>

      <View style={{alignItems: 'center', marginTop: 24}}>
        <Button type="primary" onPress={back} style={{paddingHorizontal: 48}}>
          Continue
        </Button>
      </View>
    </View>
  );
};

const S = StyleSheet.create({
  container: {
    padding: 42,
    flex: 1,
    backgroundColor: '#FFF',
  },
  title: {
    fontWeight: '600',
    fontSize: 24,
    marginBottom: 12,
    alignSelf: 'center',
    textAlign: 'center',
    paddingBottom: 8,
  },
  body: {fontSize: 18, textAlign: 'center'},
  disclaimer: {
    fontSize: 12,
    color: '#828282',
    textAlign: 'center',
    marginBottom: 16,
  },
});

const MARKDOWN_RULES: RenderRules = {
  list_item: (node, children, parent, styles) => {
    if (hasParents(parent, 'bullet_list')) {
      return (
        <View key={node.key} style={{flexDirection: 'row'}}>
          <Text style={{marginTop: 9, marginRight: 10}}>☆</Text>
          <View style={styles._VIEW_SAFE_bullet_list_content}>{children}</View>
        </View>
      );
    }

    return renderRules.list_item!(node, children, parent, styles);
  },
};

const MARKDOWN_STYLE: StyleSheet.NamedStyles<any> = {
  text: {
    color: '#202020',
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
  },
  strong: {
    fontWeight: '600',
  },
  heading3: {
    fontSize: 21,
    fontWeight: '600',
    paddingBottom: 0,
    paddingTop: 12,
  },
  paragraph: {
    marginTop: 4,
    marginBottom: 8,
  },
  link: {
    fontWeight: '500',
  },
};

AboutScreen.style = {nav: 'none', type: 'modal'};

export default AboutScreen;
