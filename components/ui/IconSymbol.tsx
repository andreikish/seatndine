// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'heart.fill': 'favorite',
  'heart.circle': 'favorite-border',
  'map.fill': 'map',
  'gearshape.fill': 'settings',
  'magnifyingglass': 'search',
  'bell.fill': 'notifications',
  'bell.slash.fill': 'notifications-off',
  'calendar': 'event',
  'person.2.fill': 'people',
  'star.fill': 'star',
  'moon.fill': 'dark-mode',
  'globe': 'language',
  'questionmark.circle.fill': 'help',
  'message.fill': 'message',
  'lock.fill': 'lock',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'xmark.circle.fill': 'cancel',
  'phone.fill': 'phone',
  'arrow.left': 'arrow-back',
  'clock': 'access-time',
  'lightbulb.fill': 'lightbulb',
  'chevron.left': 'chevron-left',
  'camera.fill': 'camera-alt',
  'envelope.fill': 'email',
  'person.crop.circle.fill': 'person',
  'rectangle.portrait.and.arrow.right.fill': 'logout',
  'qrcode': 'qr_code_2',
  'square.and.arrow.down': 'file_download',
  'pencil': 'edit'
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
