/**
 * Image component that:
 * - Downloads images to a local cache and serves up the cached version after downloaded
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {Opt} from '@toolkit/core/util/Types';
import {useFirebaseStorageResolver} from '@toolkit/providers/firebase/FileStore';
import * as React from 'react';
import {
  Image,
  ImageErrorEventData,
  ImageProps,
  NativeSyntheticEvent,
} from 'react-native';

type CachingImageProps = ImageProps & {
  errorView?: (url: string, err: string) => React.ReactElement;
  fallback?: React.ReactElement;
};

export function CachingImage(props: CachingImageProps) {
  const {source, errorView, fallback, ...rest} = props;
  const [uri, setUri] = React.useState<Opt<string>>();
  const {getUrl, scheme} = useFirebaseStorageResolver();
  const [error, setError] = React.useState<string>();

  const isImageUriSource = typeof source !== 'number' && !Array.isArray(source);
  const originalUri = isImageUriSource ? source.uri : null;
  const hasError = error != null;

  // Resolve and cache firebase URIs
  async function resolveUriIfNeeded() {
    if (originalUri != null && originalUri.startsWith(scheme + ':')) {
      const uri = await getCachedUri(originalUri, getUrl);
      setUri(uri);
    } else {
      setUri(originalUri);
    }
  }
  React.useEffect(() => {
    resolveUriIfNeeded();
  }, [source]);

  // Error handling
  function onError(e: NativeSyntheticEvent<ImageErrorEventData>) {
    const err = e.nativeEvent.error;
    setError(typeof err === 'string' ? err : 'Unknown error');
    props.onError?.(e);
  }

  if (hasError) {
    return errorView ? errorView(error, uri ?? '') : <></>;
  }

  // Show fallback if no image
  if (isImageUriSource && uri == null) {
    return fallback ?? <></>;
  }

  const src = isImageUriSource && uri != null ? {...source, uri} : source;

  return <Image {...rest} source={src} onError={onError} />;
}

type UriCacheEntry = {
  uri: string;
  created: number;
};

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

/**
 * Simple async storage cache of firebase storage URI -> HTTP URL.
 */
async function getCachedUri(
  key: string,
  resolver: (key: string) => Promise<string>,
) {
  try {
    const cached = await AsyncStorage.getItem(`uricache/${key}`);
    if (cached) {
      const entry: UriCacheEntry = JSON.parse(cached);
      // Allow one day of caching for now. This probably should come from metadata
      if (Date.now() - entry.created < DAY_MILLISECONDS) {
        return entry.uri;
      } else {
        AsyncStorage.removeItem(`uricache/${key}`);
      }
    }
  } catch (e) {
    // Ignore failures as we can refetch
  }

  const uri = await resolver(key);
  await AsyncStorage.setItem(
    `uricache/${key}`,
    JSON.stringify({uri, created: Date.now()}),
  );
  return uri;
}
