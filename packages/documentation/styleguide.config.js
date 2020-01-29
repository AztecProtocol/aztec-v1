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
    ComponentsListRenderer: path.join(__dirname, 'styleguide/components/ComponentsListRenderer'),
    Examples: path.join(__dirname, 'styleguide/components/Examples'),
    LogoRenderer: path.join(__dirname, 'styleguide/components/Logo'),
    SectionHeadingRenderer: path.join(__dirname, 'styleguide/components/SectionHeadingRenderer'),
    HeadingRenderer: path.join(__dirname, 'styleguide/components/HeadingRenderer'),
    StyleGuideRenderer: path.join(__dirname, 'styleguide/components/StyleGuideRenderer'),
    ReactComponent: path.join(__dirname, 'styleguide/components/ReactComponent'),
    ReactComponentRenderer: path.join(__dirname, 'styleguide/components/ReactComponentRenderer'),
    Playground: path.join(__dirname, 'styleguide/components/Playground'),
    PlaygroundRenderer: path.join(__dirname, 'styleguide/components/PlaygroundRenderer'),
    PropsRenderer: path.join(__dirname, 'styleguide/components/PropsRenderer'),
    ParaRenderer: path.join(__dirname, 'styleguide/components/ParaRenderer'),
    TableOfContentsRenderer: path.join(__dirname, 'styleguide/components/TableOfContentsRenderer'),
    LinkRenderer: path.join(__dirname, 'styleguide/components/LinkRenderer'),
    Preview: path.join(__dirname, 'styleguide/components/Preview'),
    // ExamplesRenderer: path.join(__dirname, 'styleguide/components/ExamplesRenderer'),
  },
  sections: [
    {
      name: 'Introduction',
      content: 'styleguide/categories/Introduction.md',
      exampleMode: 'collapse',
      usageMode: 'collapse',
    },
    {
      name: 'SDK',
      content: 'styleguide/categories/WebSDK/sdkOverview.md',
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
          name: 'zkAsset',
          content: 'styleguide/categories/WebSDK/ZkAsset/index.md',
          exampleMode: 'shown',
          sections: [
            {
              name: 'zkAsset.deposit',
              content: 'styleguide/categories/WebSDK/ZkAsset/deposit.md',
              usageMode: 'expand',
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
              name: 'zkAsset.balance',
              content: 'styleguide/categories/WebSDK/ZkAsset/balance.md',
              exampleMode: 'hide',
            },
            {
              name: 'zkAsset.createNoteFromBalance',
              content: 'styleguide/categories/WebSDK/ZkAsset/createNoteFromBalance.md',
              exampleMode: 'hide',
            },
            // {
            //   name: 'zkAsset.fetchNotesFromBalance',
            //   content: 'styleguide/categories/WebSDK/ZkAsset/fetchNotesFromBalance.md ',
            //   exampleMode: 'hide',
            // },
            {
              name: 'zkAsset.balanceOfLinkedToken',
              content: 'styleguide/categories/WebSDK/ZkAsset/balanceOfLinkedToken.md',
              exampleMode: 'hide',
            },
            {
              name: 'zkAsset.allowanceOfLinkedToken',
              content: 'styleguide/categories/WebSDK/ZkAsset/allowanceOfLinkedToken.md',
              exampleMode: 'hide',
            },
            {
              name: 'zkAsset.totalSupplyOfLinkedToken',
              content: 'styleguide/categories/WebSDK/ZkAsset/totalSupplyOfLinkedToken.md',
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
              name: 'note.equal',
              content: 'styleguide/categories/WebSDK/Note/equal.md',
              exampleMode: 'hide',
            },
            {
              name: 'note.export',
              content: 'styleguide/categories/WebSDK/Note/export.md',
              exampleMode: 'hide',
            },
            {
              name: 'note.grantAccess',
              content: 'styleguide/categories/WebSDK/Note/grantAccess.md',
              exampleMode: 'hide',
            },
            {
              name: 'note.greaterThan',
              content: 'styleguide/categories/WebSDK/Note/greaterThan.md',
              exampleMode: 'hide',
            },
            {
              name: 'note.greaterThanOrEqualTo',
              content: 'styleguide/categories/WebSDK/Note/greaterThanOrEqualTo.md',
              exampleMode: 'hide',
            },
            {
              name: 'note.lessThan',
              content: 'styleguide/categories/WebSDK/Note/lessThan.md',
              exampleMode: 'hide',
            },
            {
              name: 'note.lessThanOrEqualTo',
              content: 'styleguide/categories/WebSDK/Note/lessThanOrEqualTo.md',
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
      content: 'styleguide/categories/ReferenceSpecification.md',
      sections: [],
      sectionDepth: 1,
    },
  ],
  webpackConfig: webpackConfig('development'),
  pagePerSection: true,
};
