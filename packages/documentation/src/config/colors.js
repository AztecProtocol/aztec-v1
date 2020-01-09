export const colorMap = {
    primary: 'rgb(18,38,63)',
    'primary-light': 'rgba(18,38,63, 0.8)',
    'primary-lighter': 'rgba(18,38,63, 0.5)',
    'primary-lightest': 'rgba(18,38,63, 0.1)',

    black: '#000000',
    'grey-darker': 'rgba(0, 0, 0, 0.85)',
    'grey-dark': 'rgba(0, 0, 0, 0.7)',
    grey: 'rgba(0, 0, 0, 0.45)',
    'grey-light': 'rgba(0, 0, 0, 0.2)',
    'grey-lighter': 'rgba(0, 0, 0, 0.1)',
    'grey-lightest': '#F9fbfd',

    white: '#FFFFFF',
    'white-light': 'rgba(255, 255, 255, 0.85)',
    'white-lighter': 'rgba(255, 255, 255, 0.5)',
    'white-lightest': 'rgba(255, 255, 255, 0.1)',

    transparent: 'rgba(255, 255, 255, 0)',

    secondary: 'rgb(74,144,226)',
    'secondary-light': 'rgba(74, 144, 226, 0.7)',
    'secondary-lighter': 'rgba(74,144,226, 0.3)',
    'secondary-lightest': 'rgba(74,144,226, 0.1)',

    pink: '#F7B2D1',
    red: '#F23A5B',
    purple: '#49098A',
    blue: '#2772CE',
    green: '#41BA00',
    yellow: '#FACB00',
    orange: '#E57300',
    brown: '#49311A',
};

export const darkBackgroundColors = [
    'primary',
    'primary-light',
    'primary-lighter',
    'secondary',
    'secondary-light',
    'black',
    'grey-darker',
    'grey-dark',
    'grey',
    'red',
    'purple',
    'blue',
    'green',
    'orange',
    'brown',
    'white-lightest',
];

export const defaultShadowColorName = 'grey-lighter';
export const defaultShadowColor = colorMap[defaultShadowColorName];

export const defaultBorderColorName = 'grey-lighter';
export const defaultBorderColor = colorMap[defaultBorderColorName];

export const defaultHoverBackgroundColorName = 'grey-lightest';
export const defaultHoverBackgroundColor = colorMap[defaultHoverBackgroundColorName];

export const defaultTextColorName = 'grey-darker';
export const defaultTextColor = colorMap[defaultTextColorName];

export const defaultLabelColorName = 'grey';
export const defaultLabelColor = colorMap[defaultLabelColorName];

export const defaultLinkColorName = 'secondary';
export const defaultLinkColor = colorMap[defaultLinkColorName];

export const overlayThemeBgMap = {
    primary: 'primary-lightest',
    secondary: 'secondary-lightest',
    white: 'white-lighter',
};

export const svgProgressThemeBgMap = {
    primary: 'primary-lightest',
    secondary: 'secondary-lightest',
    white: 'white-lighter',
};
