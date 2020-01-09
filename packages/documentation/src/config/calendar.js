import { defaultSize } from './styleConstants';
import { colorMap, defaultTextColorName, defaultLabelColorName } from './colors';

/*
 * Commented attributes will use inhirited values
 */

const baseSpacing = parseInt(defaultSize, 10);
const calendarDaySize = baseSpacing * 5 + 1;

export const calendarBgName = 'white';
export const calendarBg = colorMap[calendarBgName];

export const calendarMonthWidth = `${calendarDaySize * 7 + baseSpacing * 4}px`;
export const calendarMonthPaddingSizeKey = 'l';
export const calendarMonthFontSizeKey = 'm';
// calendarMonthFontWeight
// calendarMonthColor
// calendarMonthBg

export const calendarWeekFontSizeKey = 'xs';
// calendarWeekFontWeight
export const calendarWeekColorName = defaultLabelColorName;
export const calendarWeekColor = colorMap[calendarWeekColorName];
// calendarWeekBg

export const calendarDayWidth = `${calendarDaySize}px`;
export const calendarDayHeight = `${calendarDaySize}px`;
export const calendarDayFontSizeKey = 's';
// calendarDayFontWeight
// calendarDayColor

// calendarHoveredFontWeight
export const calendarHoveredColorName = defaultTextColorName;
export const calendarHoveredColor = colorMap[defaultTextColorName];
export const calendarHoveredBgName = 'secondary-lightest';
export const calendarHoveredBg = colorMap[calendarHoveredBgName];

// calendarSelectedFontWeight
export const calendarSelectedColorName = 'white';
export const calendarSelectedColor = colorMap[calendarSelectedColorName];
export const calendarSelectedBgName = 'secondary';
export const calendarSelectedBg = colorMap.secondary;

// calendarInRangeFontWeight
// calendarInRangeColor
export const calendarInRangeBgName = 'secondary-lightest';
export const calendarInRangeBg = colorMap[calendarInRangeBgName];

// calendarOutsideFontWeight
export const calendarOutsideColorName = defaultLabelColorName;
export const calendarOutsideColor = colorMap[calendarOutsideColorName];
// calendarOutsideBg
