require('babel-polyfill');

require('@babel/register');
const path = require('path');
const webpackConfig = require('./webpack.config').default;
const { defaultFontFamily, fontSizeMap } = require('./src/config/typography');
const {
  defaultTextColor, defaultLabelColor, defaultLinkColor, defaultBorderColor, colorMap,
} = require('./src/config/colors');

module.exports = {
  title: 'AZTEC Docs',
  styleguideDir: 'public',
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
          src: 'https://sdk.aztecprotocol.com/1.3.0/sdk/aztec.js',
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
      base: '#1E1B2B',
      light: '#53506B',
      lightest: colorMap['grey-lightest'],
      link: '#fff',
      linkHover: 'rgba(255,255,255,0.8)',
      border: defaultBorderColor,
      sidebarBackground: colorMap['grey-lightest'],
      codeBackground: colorMap['grey-lightest'],
      codeBase: '#333',
      name: colorMap.blue,
      type: colorMap.purple,
      codeComment: '#6d6d6d',
      codePunctuation: '#999',
      codeProperty: colorMap.orange,
      codeDeleted: colorMap.red,
      codeString: colorMap.blue,
      codeInserted: colorMap.purple,
      codeOperator: '#9a6e3a',
      codeKeyword: colorMap.red,
      codeFunction: colorMap.purple,
      codeVariable: colorMap.orange,
    },
    styles: function styles(theme) {
      return {
        Playground: {
          preview: {
            paddingLeft: 0,
            paddingRight: 0,
            borderWidth: [[0, 0, 1, 0]],
            borderRadius: 0,
          },
        },
        ComponentsListRenderer: {

        },
        Markdown: {
          thead: {
            fontWeight: '400 !important',
          },
        },
        Code: {
          code: {
            // make inline code example appear the same color as links
            color: theme.color.link,
            fontSize: 14,
          },
        },
      };
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
    TableRenderer: path.join(__dirname, 'styleguide/components/TableRenderer'),
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
      pagePerSection: true,
      sections: [
        {
          name: 'The role of the SDK',
          content: 'styleguide/categories/WebSDK/sdkOverview.md',
          exampleMode: 'shown',
        },
        {
          name: 'Getting started',
          content: 'styleguide/categories/WebSDK/gettingStarted.md',
          exampleMode: 'hide',
        },
        {
          name: 'zkAsset',
          sections: [
            {
              name: 'zkAsset-introduction',
              content: 'styleguide/categories/WebSDK/ZkAsset/index.md',
              exampleMode: 'shown',
            },
            {
              name: '.deposit',
              content: 'styleguide/categories/WebSDK/ZkAsset/deposit.md',
              usageMode: 'expand',
            },
            {
              name: '.send',
              content: 'styleguide/categories/WebSDK/ZkAsset/send.md',
              exampleMode: 'hide',
            },
            {
              name: '.withdraw',
              content: 'styleguide/categories/WebSDK/ZkAsset/withdraw.md',
              exampleMode: 'hide',
            },
            {
              name: '.balance',
              content: 'styleguide/categories/WebSDK/ZkAsset/balance.md',
              exampleMode: 'hide',
            },
            {
              name: '.createNoteFromBalance',
              content: 'styleguide/categories/WebSDK/ZkAsset/createNoteFromBalance.md',
              exampleMode: 'hide',
            },
            {
              name: '.fetchNotesFromBalance',
              content: 'styleguide/categories/WebSDK/ZkAsset/fetchNotesFromBalance.md',
              exampleMode: 'hide',
            },
            {
              name: '.balanceOfLinkedToken',
              content: 'styleguide/categories/WebSDK/ZkAsset/balanceOfLinkedToken.md',
              exampleMode: 'hide',
            },
            {
              name: '.allowanceOfLinkedToken',
              content: 'styleguide/categories/WebSDK/ZkAsset/allowanceOfLinkedToken.md',
              exampleMode: 'hide',
            },
            {
              name: '.totalSupplyOfLinkedToken',
              content: 'styleguide/categories/WebSDK/ZkAsset/totalSupplyOfLinkedToken.md',
              exampleMode: 'hide',
            },
          ],
          sectionDepth: 1,
          usageMode: 'hide',
        },
        {
          name: 'note',
          pagePerSection: true,
          sections: [
            {
              name: 'note-introduction',
              content: 'styleguide/categories/WebSDK/Note/index.md',
              exampleMode: 'hide',
            },
            {
              name: '.equal',
              content: 'styleguide/categories/WebSDK/Note/equal.md',
              exampleMode: 'hide',
            },
            {
              name: '.export',
              content: 'styleguide/categories/WebSDK/Note/export.md',
              exampleMode: 'hide',
            },
            {
              name: '.grantAccess',
              content: 'styleguide/categories/WebSDK/Note/grantAccess.md',
              exampleMode: 'hide',
            },
            {
              name: '.greaterThan',
              content: 'styleguide/categories/WebSDK/Note/greaterThan.md',
              exampleMode: 'hide',
            },
            {
              name: '.greaterThanOrEqualTo',
              content: 'styleguide/categories/WebSDK/Note/greaterThanOrEqualTo.md',
              exampleMode: 'hide',
            },
            {
              name: '.lessThan',
              content: 'styleguide/categories/WebSDK/Note/lessThan.md',
              exampleMode: 'hide',
            },
            {
              name: '.lessThanOrEqualTo',
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
