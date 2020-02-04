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
      clear: 'rgba(255,255,255, 0)',
      'grey-darker': 'rgba(2, 1, 8, 0.88)',
      // 'white':'#FAFAF8',
      // 'grey-lighter':'#e8e7e7',
      'grey-lightest': '#e8e7e7',
    },
    defaultTextColor: '#221635',
    defaultLabelColor: '#9699BA',
    defaultLinkColor: '#898BF6',
    lineHeightMap: {
      xxs: '24px',
      xs: '26px',
      s: '32px',
      m: '38px',
      l: '46px',
      xl: '58px',
      xxl: '66px',
    },
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
    buttonTextSizeMap: {
      xxs: 'xxs',
      xs: 'xs',
      s: 's',
      m: 's',
      l: 's',
      xl: 's',
      xxl: 's',
    },
    fontSizeMap: {
      xxs: '14px',
      xs: '15px',
      s: '17px',
      m: '22px',
      l: '32px',
      xl: '40px',
      xxl: '50px',
    },
  },
};
