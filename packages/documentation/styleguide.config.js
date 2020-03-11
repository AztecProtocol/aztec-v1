require('babel-polyfill');
require('@babel/register');
const path = require('path');
const webpackConfig = require('./webpack.config').default;
const {
  fontSizeMap,
  defaultBorderColor,
  colorMap,
} = require('./src/styles/guacamole-vars');

module.exports = {
  title: 'AZTEC Docs',
  styleguideDir: 'public',
  require: [
    // path.resolve(__dirname, './src/styles/reset.scss')
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
        ComponentsListRenderer: {},
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
          name: 'user',
          pagePerSection: true,
          sections: [
            {
              name: 'Introduction',
              content: 'styleguide/categories/WebSDK/User/index.md',
              exampleMode: 'hide',
            },
            {
              name: '.createNote',
              content: 'styleguide/categories/WebSDK/User/createNote.md',
              exampleMode: 'hide',
            },
            {
              name: '.encryptMessage',
              content: 'styleguide/categories/WebSDK/User/encryptMessage.md',
              exampleMode: 'hide',
            },
            {
              name: '.decryptMessage',
              content: 'styleguide/categories/WebSDK/User/decryptMessage.md',
              exampleMode: 'hide',
            },
          ],
          sectionDepth: 1,
          usageMode: 'hide',
        },
        {
          name: 'zkAsset',
          sections: [
            {
              name: 'Introduction',
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
              name: '.subscribeToBalance',
              content: 'styleguide/categories/WebSDK/ZkAsset/subscribeToBalance.md',
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
            {
              name: '.toNoteValue',
              content: 'styleguide/categories/WebSDK/ZkAsset/toNoteValue.md',
              exampleMode: 'hide',
            },
            {
              name: '.toTokenValue',
              content: 'styleguide/categories/WebSDK/ZkAsset/toTokenValue.md',
              exampleMode: 'hide',
            },
          ],
          sectionDepth: 1,
          usageMode: 'hide',
        },
        {
          name: 'zkNote',
          pagePerSection: true,
          sections: [
            {
              name: 'Introduction',
              content: 'styleguide/categories/WebSDK/Note/index.md',
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
              name: '.equal',
              content: 'styleguide/categories/WebSDK/Note/equal.md',
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
      content: 'styleguide/categories/ReferenceSpecification/Contents.md',
      pagePerSection: true,
      sectionDepth: 2,
      sections: [
        {
          name: 'Architecture',
          content: 'styleguide/categories/ReferenceSpecification/Architecture.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'The Note Registry',
          content: 'styleguide/categories/ReferenceSpecification/TheNoteRegistry.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'ACE, the AZTEC Cryptography Engine',
          content: 'styleguide/categories/ReferenceSpecification/ACE.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'The key responsibilites of ACE',
          content: 'styleguide/categories/ReferenceSpecification/TheKeyResponsibilitiesOfACE.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Contract Interactions',
          content: 'styleguide/categories/ReferenceSpecification/ContractInteractions.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Validating an AZTEC proof',
          content: 'styleguide/categories/ReferenceSpecification/ValidatingAnAZTECProof.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Note registry implementation',
          content: 'styleguide/categories/ReferenceSpecification/NoteRegistryImplementation.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Processing a transfer instruction',
          content: 'styleguide/categories/ReferenceSpecification/ProcessingATransferInstruction.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Minting AZTEC notes',
          content: 'styleguide/categories/ReferenceSpecification/MintingAZTECNotes.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Burning AZTEC notes',
          content: 'styleguide/categories/ReferenceSpecification/BurningAZTECNotes.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Interacting with ACE: zkAsset',
          content: 'styleguide/categories/ReferenceSpecification/InteractingWithACEZkAsset.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'AccountRegistry',
          content: 'styleguide/categories/ReferenceSpecification/AccountRegistry.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Proof verification contracts',
          content: 'styleguide/categories/ReferenceSpecification/ProofVerificationContracts.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Specification of Utility libraries',
          content: 'styleguide/categories/ReferenceSpecification/SpecificationOfUtilityLibraries.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Appendix',
          content: 'styleguide/categories/ReferenceSpecification/Appendix.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
        {
          name: 'Glossary',
          content: 'styleguide/categories/ReferenceSpecification/Glossary.md',
          exampleMode: 'hide',
          usageMode: 'hide',
        },
      ],
    },
  ],
  tocMode: 'collapse',
  webpackConfig: webpackConfig('development'),
  pagePerSection: true,
};
