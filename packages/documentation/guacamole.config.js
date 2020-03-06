const path = require('path');

module.exports = {
  output: {
    path: path.resolve(__dirname, './src/styles'),
  },
  theme: {
    defaultFontFamily: '\'Gill Sans\', sans-serif',
    colorMap: {
      primary: '#898BF6',
      'primary-light': 'rgba(137, 139, 246, 0.7)',
      'primary-lighter': 'rgba(137, 139, 246, 0.45)',
      'primary-lightest': 'rgb(244, 245, 254)',
      secondary: '#17173C',
      'secondary-light': '#222261',
      'grey-darker': 'rgba(2, 1, 8, 0.88)',
      'grey-lightest': 'rgb(246, 250, 255)',
    },
    defaultTextColor: '#221635',
    defaultLabelColor: '#9699BA',
    defaultLinkColor: '#898BF6',
    pageSpacingKeyMap: {
      xxl: 'xxl',
      xl: 'xxl',
      l: 'xxl',
      m: 'xxl',
      s: 'xl',
      xs: 'xl',
      xxs: 'xl',
    },
    buttonSizeMap: {
      l: '44px',
    },
    buttonThemeMap: {
      primary: 'primary',
    },
    buttonTextSizeMap: {
      s: 'xxs',
      m: 'xs',
    },
    inputFontSizeKeyMap: {
      l: 'xs',
      m: 'xs',
    },
    defaultInputOutlineColor: '#fff',
    defaultInputActiveOutlineColor: '#fff',
    deviceBreakpointMap: {
      l: '1220px',
      xl: '1440px',
    },
    fontSizeMap: {
      xxs: '12px',
      xs: '14px',
      s: '16px',
      m: '22px',
      l: '32px',
      xl: '42px',
      xxl: '52px',
    },
    lineHeightMap: {
      xxs: '20px',
      xs: '24px',
      s: '32px',
      m: '36px',
      l: '48px',
      xl: '58px',
      xxl: '66px',
    },
  },
};
