const path = require('path');

module.exports = {
    output: {
        path: path.resolve(__dirname, './src/ui/styles'),
    },
    theme: {
        defaultFontFamily: '\'Gill Sans\', sans-serif',
        colorMap: {
            primary: '#808dff',
            'primary-light': 'rgba(137, 139, 246, 0.7)',
            'primary-lighter': 'rgba(137, 139, 246, 0.45)',
            'primary-lightest': 'rgb(244, 245, 254)',
            secondary: '#17173C',
            'secondary-light': '#222261',
            'white-lightest': 'rgba(255,255,255,0.3)',
            green: 'rgb(76, 199, 170)',
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
            xxs: '12px',
            xs: '14px',
            s: '16px',
            m: '18px',
            l: '24px',
            xl: '28px',
            xxl: '34px',
        },
        lineHeightMap: {
            l: '32px',
            xl: '40px',
            xxl: '48px',
        },
    },
};
