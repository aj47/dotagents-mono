import { Platform } from 'react-native';

export type MobileFontFamilyByPlatform = Readonly<{
  ios: string;
  default: string;
}>;

export const resolveMobileFontFamily = (fontFamilyByPlatform: MobileFontFamilyByPlatform) =>
  Platform.OS === 'ios' ? fontFamilyByPlatform.ios : fontFamilyByPlatform.default;
