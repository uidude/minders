import {simpleAboutScreen} from '@toolkit/screens/settings/AboutScreen';
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

const AboutScreen: Screen<{}> = simpleAboutScreen({
  title: TitleMarkdown,
  body: DescriptionMarkdown,
});

AboutScreen.style = {nav: 'none', type: 'modal'};

export default AboutScreen;
