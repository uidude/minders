import config from './app.json';

const buildProfile =
  process.env.EAS_BUILD_PROFILE ?? process.env.BUILD_TYPE ?? 'dev';
// Builds get unique bundle ID (iOS) and package name (Android)
const BUNDLE_SUFFIXES = {
  sim: '.dev',
  dev: '.dev',
  alpha: '.alpha',
  prod: '',
};
const bundleSuffix = BUNDLE_SUFFIXES[buildProfile];
if (!config.expo.ios.bundleIdentifier.endsWith(bundleSuffix)) {
  config.expo.ios.bundleIdentifier += bundleSuffix;
}
if (!config.expo.android.package.endsWith(bundleSuffix)) {
  config.expo.android.package += bundleSuffix;
}

// The most effetive way to distinguish builds is with a custom icon.
// To use this, when you add an icon stamp "dev" or "alpha" on different versions
const ICONS = {
  sim: '../project/assets/icon.dev.png',
  dev: '../project/assets/icon.dev.png',
  alpha: '../project/assets/icon.alpha.png',
  prod: '../project/assets/icon.png',
};
if (ICONS[buildProfile]) {
  config.expo.icon = ICONS[buildProfile];
}

// Different names suffixes also work, but can be confusing to users.
// Because names need to be short, you can't use a full descriptive word.
// Uncomment below to use greek letters as suffixes.
const NAME_SUFFIXES = {
  sim: ' δ',
  dev: ' δ',
  alpha: ' β',
  prod: '',
};
// Other options: 🧪⚡⚓⚚♥☕☃☀

// Uncomment this if you want to use different app names instead of
// icons for your different builds.
const nameSuffix = NAME_SUFFIXES[buildProfile];
if (!config.expo.name.endsWith(nameSuffix)) {
  // config.expo.name += nameSuffix;
}

export default config;
