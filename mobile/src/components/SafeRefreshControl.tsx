import { Platform, RefreshControl, type RefreshControlProps } from 'react-native';

/**
 * On web, NEVER pass a React element that renders null as `refreshControl` —
 * RN-web ScrollView/FlatList can end up with an empty scene.
 * Use `webRefreshControl(props)` which returns `undefined` on web.
 */
export function webRefreshControl(props: RefreshControlProps) {
  if (Platform.OS === 'web') return undefined;
  return <RefreshControl {...props} />;
}

/** @deprecated Prefer webRefreshControl(...) as the prop value */
export function SafeRefreshControl(props: RefreshControlProps) {
  if (Platform.OS === 'web') return null;
  return <RefreshControl {...props} />;
}
