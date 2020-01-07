import {
  buttonSizeMap,
} from './buttons';
import {
  colorMap,
  overlayThemeBgMap,
} from './colors';
import {
  inputSizeMap,
} from './inputs';
import {
  deviceBreakpointMap,
  spacingMap,
} from './layout';
import {
  roundedCornerMap,
} from './shapes';
import {
  fontSizeMap,
  fontWeightMap,
} from './typography';

// buttons
export const buttonSizeKeys = Object.keys(buttonSizeMap);

// colors
export const colorNames = Object.keys(colorMap);
export const backgroundNames = colorNames;
export const textColorNames = [...colorNames, 'default', 'label'];
export const overlayThemeNames = Object.keys(overlayThemeBgMap);

// inputs
export const defaultInputSizeKey = 'm';
export const inputSizeKeys = Object.keys(inputSizeMap);
export const inputThemeNames = [
  'default',
  'inline',
  'dark',
];
export const inputStatusNames = [
  'error',
  'focus',
];

// layout
export const deviceBreakpointKeys = Object.keys(deviceBreakpointMap);
export const defaultDeviceBreakpointKey = 'xxs';

export const sizeKeys = Object.keys(spacingMap);
export const defaultSize = '8px';

export const maxGridColumns = 12;

// shapes
export const roundedCornerKeys = Object.keys(roundedCornerMap);
export const defaultRoundedCornerKey = 'xs';

export const shadowLayerKeys = [0, 1, 2, 3];

export const imageRatioNames = [
  'square', // 1 * 1
  'classic', // 3 * 2
  'golden', // 16.18 * 10
  'landscape', // 16 * 9
  'ultra', // 2.76 * 1
];

export const shapeSizeKeys = sizeKeys;

// icons
export const iconRotateDegrees = [0, 90, 180, 270];

// typography
export const fontSizeKeys = Object.keys(fontSizeMap);
export const defaultFontSizeKey = 'xs';

export const fontWeightKeys = [
  'inherit',
  ...Object.keys(fontWeightMap),
];

export const specialTextColorNames = [
  'default',
  'label',
];
