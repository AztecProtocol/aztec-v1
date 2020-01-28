require('babel-polyfill');

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
    ReactComponent: path.join(__dirname, 'styleguide/components/ReactComponent'),
    ReactComponentRenderer: path.join(__dirname, 'styleguide/components/ReactComponentRenderer'),
    Playground: path.join(__dirname, 'styleguide/components/Playground'),
    PlaygroundRenderer: path.join(__dirname, 'styleguide/components/PlaygroundRenderer'),
    PropsRenderer: path.join(__dirname, 'styleguide/components/PropsRenderer'),
    ParaRenderer: path.join(__dirname, 'styleguide/components/ParaRenderer'),
    TableOfContentsRenderer: path.join(__dirname, 'styleguide/components/TableOfContentsRenderer'),
    LinkRenderer: path.join(__dirname, 'styleguide/components/LinkRenderer'),
    Preview: path.join(__dirname, 'styleguide/components/Preview'),
    Examples: path.join(__dirname, 'styleguide/components/Examples'),
    ExamplesRenderer: path.join(__dirname, 'styleguide/components/ExamplesRenderer'),
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
    // {
    //   name: 'Smart Contracts',
    //   content: 'styleguide/categories/SmartContracts.md',
    //   sections: [
    //     {
    //       name: 'ACE',
    //       content: 'src/config/custom.md',
    //       exampleMode: 'hide',
    //     },
    //     {
    //       name: 'Validators',
    //       content: 'src/config/custom.md',
    //       exampleMode: 'hide',
    //     },
    //     {
    //       name: 'ZkAsset',
    //       content: 'src/config/custom.md',
    //       exampleMode: 'hide',
    //     },
    //     {
    //       name: 'ZkAssetOwnable',
    //       content: 'src/config/custom.md',
    //       exampleMode: 'hide',
    //     },
    //     {
    //       name: 'ZkAssetMintable',
    //       content: 'src/config/custom.md',
    //       exampleMode: 'hide',
    //     },
    //     {
    //       name: 'ZkAssetBurnable',
    //       content: 'src/config/custom.md',
    //       exampleMode: 'hide',
    //     },
    //   ],
    //   sectionDepth: 2,
    //   exampleMode: 'collapse',
    //   usageMode: 'collapse',
    //   pagePerSection: true,
    // },
    {
      name: 'SDK',
      content: 'styleguide/categories/WebSDK/overview.md',
      components: [],
      exampleMode: 'shown',
      pagePerSection: true,
      sections: [
        {
          name: 'Getting started',
          content: 'styleguide/categories/WebSDK/gettingStarted.md',
          exampleMode: 'hide',
        },
        {
          name: 'window',
          content: 'styleguide/categories/WebSDK/Window/index.md',
          exampleMode: 'hide',
        },
        {
          name: 'zkAsset',
          content: 'styleguide/categories/WebSDK/ZkAsset/index.md',
          exampleMode: 'shown',
          sections: [
            {
              name: 'zkAsset.balance',
              content: 'styleguide/categories/WebSDK/ZkAsset/balance.md',
              exampleMode: 'hide',
            },
            {
              name: 'zkAsset.fetchNotesFromBalance',
              content: 'styleguide/categories/WebSDK/ZkAsset/fetchNotesFromBalance.md',
              exampleMode: 'hide',
            },
            {
              name: 'zkAsset.deposit',
              content: 'styleguide/categories/WebSDK/ZkAsset/deposit.md',
              usageMode: 'expand',
              pagePerSection: false,
            },
            {
              name: 'zkAsset.send',
              content: 'styleguide/categories/WebSDK/ZkAsset/send.md',
              exampleMode: 'hide',
            },
            {
              name: 'zkAsset.withdraw',
              content: 'styleguide/categories/WebSDK/ZkAsset/withdraw.md',
              exampleMode: 'hide',
            },
            {
              name: 'zkAsset.refresh',
              content: 'styleguide/categories/WebSDK/ZkAsset/refresh.md',
              exampleMode: 'hide',
            },
          ],
          sectionDepth: 1,
          usageMode: 'hide',
        },
        {
          name: 'note',
          content: 'styleguide/categories/WebSDK/Note/index.md',
          exampleMode: 'hide',
          pagePerSection: true,
          sections: [
            {
              name: 'note.value',
              content: 'styleguide/categories/WebSDK/Note/value.md',
              exampleMode: 'hide',
            },
            {
              name: 'note.grantNoteAccess',
              content: 'styleguide/categories/WebSDK/Note/grantNoteAccess.md',
              exampleMode: 'hide',
            },
            {
              name: 'note.owner',
              content: 'styleguide/categories/WebSDK/Note/owner.md',
              exampleMode: 'hide',
            },
            {
              name: 'note.hash',
              content: 'styleguide/categories/WebSDK/Note/hash.md',
              exampleMode: 'hide',
            },
          ],
          sectionDepth: 1,
          usageMode: 'hide',
        },
      ],
      sectionDepth: 3,
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
