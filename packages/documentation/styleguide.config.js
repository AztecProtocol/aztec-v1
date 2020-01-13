require('@babel/register');
const path = require('path');
const webpackConfig = require('./webpack.config').default;
const { defaultFontFamily, fontSizeMap } = require('./src/config/typography');
const { defaultTextColor, defaultLabelColor, defaultLinkColor, defaultBorderColor, colorMap } = require('./src/config/colors');

module.exports = {
  title: 'AZTEC Docs',
  require: [
    // path.resolve(__dirname, './src/styles/reset.scss'),
  ],
  template: {
    head: {
      links: [
        {
          rel: 'canonical',
          href: 'https://docs.aztecprotocol.com',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/icon?family=Material+Icons',
        },
      ],
      scripts: [
        {
          type: 'text/javascript',
          src: 'https://sdk.aztecprotocol.com/aztec.js',
        },
      ],
    },
  },
  styles: {
    StyleGuide: {
      '@global body': {
        base: 'Gill Sans',
      },
    },
  },
  theme: {
    fontFamily: {
      base: 'Gill Sans',
    },

    fontSize: {
      base: 16,
      text: 16,
      small: 12,
      h1: fontSizeMap.xxl,
      h2: fontSizeMap.xl,
      h3: fontSizeMap.l,
      h4: fontSizeMap.m,
      h5: fontSizeMap.s,
      h6: fontSizeMap.xs,
    },
    color: {
      base: '#20293E',
      light: '#BDC0DF',
      lightest: colorMap['grey-lightest'],
      link: '#fff',
      linkHover: 'rgba(255,255,255,0.8)',
      border: defaultBorderColor,
      sidebarBackground: colorMap['grey-lightest'],
      codeBackground: colorMap['grey-lightest'],
      codeBase: '#333',
      name: colorMap.green,
      type: colorMap.purple,
      codeComment: '#6d6d6d',
      codePunctuation: '#999',
      codeProperty: colorMap.orange,
      codeDeleted: colorMap.red,
      codeString: colorMap.green,
      codeInserted: colorMap.purple,
      codeOperator: '#9a6e3a',
      codeKeyword: colorMap.blue,
      codeFunction: colorMap.purple,
      codeVariable: colorMap.orange,
    },
  },
  styleguideComponents: {
    LogoRenderer: path.join(__dirname, 'styleguide/components/Logo'),
    StyleGuideRenderer: path.join(__dirname, 'styleguide/components/StyleGuideRenderer'),
    ComponentsListRenderer: path.join(__dirname, 'styleguide/components/ComponentsListRenderer'),
    SectionHeadingRenderer: path.join(__dirname, 'styleguide/components/SectionHeadingRenderer'),
    HeadingRenderer: path.join(__dirname, 'styleguide/components/HeadingRenderer'),
    ReactComponentRenderer: path.join(__dirname, 'styleguide/components/ReactComponentRenderer'),
    PlaygroundRenderer: path.join(__dirname, 'styleguide/components/PlaygroundRenderer'),
    ParaRenderer: path.join(__dirname, 'styleguide/components/ParaRenderer'),
    TableOfContentsRenderer: path.join(__dirname, 'styleguide/components/TableOfContentsRenderer'),
    LinkRenderer: path.join(__dirname, 'styleguide/components/LinkRenderer'),
    Preview: path.join(__dirname, 'styleguide/components/Preview'),
  },
  sections: [
    {
      name: 'Introduction',
      content: 'styleguide/categories/Introduction.md',
      sections: [
        {
          name: 'Background',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
        {
          name: 'Getting Started',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
        {
          name: 'Roadmap',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
      ],
      sectionDepth: 1,
      exampleMode: 'collapse',
      usageMode: 'collapse',
    },
    {
      name: 'Smart Contracts',
      content: 'styleguide/categories/SmartContracts.md',
      sections: [
        {
          name: 'ACE',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
        {
          name: 'Validators',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
        {
          name: 'ZkAsset',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
        {
          name: 'ZkAssetOwnable',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
        {
          name: 'ZkAssetMintable',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
        {
          name: 'ZkAssetBurnable',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
      ],
      sectionDepth: 2,
      exampleMode: 'collapse',
      usageMode: 'collapse',
      pagePerSection: true,
    },
    {
      name: 'JavaScript SDK',
      content: 'styleguide/categories/JavaScriptSDK/index.md',
      pagePerSection: true,
      components: ['src/components/Demo/index.jsx'],
      sections: [
        {
          name: 'Background',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
        {
          name: 'Getting Started & API Keys',
          content: 'src/config/custom.md',
          exampleMode: 'hide',
        },
        {
          name: 'API Methods',
          content: 'src/config/custom.md',
          exampleMode: 'collapse',
          usageMode: 'collapse',
          hasParent: true,
          pagePerSection: true,
          sections: [
            {
              name: 'window.aztec.enable',
              content: 'src/config/custom.md',
              exampleMode: 'hide',
            },
            {
              name: 'window.aztec.zkAsset',
              content: 'styleguide/categories/JavaScriptSDK/deposit.md',
              exampleMode: 'hide',
            },
            {
              name: 'window.aztec.zkNote',
              content: 'src/config/custom.md',
              exampleMode: 'hide',
            },
            {
              name: 'window.aztec.proofs',
              content: 'src/config/custom.md',
              exampleMode: 'hide',
            },
          ],
          sectionDepth: 1,
          exampleMode: 'collapse',
          usageMode: 'collapse',
        },
      ],
      sectionDepth: 2,
    },
    {
      name: 'Guides',
      content: 'styleguide/categories/Guides.md',
      sections: [],
      sectionDepth: 1,
    },
    {
      name: 'Reference Specification',
      content: 'styleguide/categories/Referrence.md',
      sections: [],
      sectionDepth: 1,
    },
  ],
  webpackConfig: webpackConfig('development'),
  pagePerSection: true,
};
