import BN from 'bn.js';
import PropTypes from 'prop-types';

export const bigNumberType = PropTypes.instanceOf(BN);

export const themeType = PropTypes.oneOf([
    'primary',
    'white',
    'light',
    'dark',
]);

export const siteShape = PropTypes.shape({
    title: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    domain: PropTypes.string.isRequired,
    icons: PropTypes.arrayOf(PropTypes.shape({
        href: PropTypes.string.isRequired,
        sizes: PropTypes.string,
    })),
});

export const assetShape = PropTypes.shape({
    address: PropTypes.string.isRequired,
    linkedTokenAddress: PropTypes.string,
    scalingFactor: bigNumberType.isRequired,
    name: PropTypes.string,
    icon: PropTypes.string,
    symbol: PropTypes.string,
    decimals: PropTypes.number,
});

export const simpleAssetShape = PropTypes.shape({
    address: PropTypes.string.isRequired,
    linkedTokenAddress: PropTypes.string,
    name: PropTypes.string,
    icon: PropTypes.string,
    symbol: PropTypes.string,
    decimals: PropTypes.number,
});

export const profileType = PropTypes.oneOf([
    '',
    'token',
    'asset',
    'user',
    'aztec',
    'domain',
    'note',
]);

const assetProfileShape = PropTypes.shape({
    type: PropTypes.oneOf(['asset', 'token']),
    address: PropTypes.string.isRequired,
    linkedTokenAddress: PropTypes.string,
    icon: PropTypes.string,
});

const userProfileShape = PropTypes.shape({
    type: PropTypes.oneOf(['user']),
    address: PropTypes.string.isRequired,
    src: PropTypes.string,
});

const noteProfileShape = PropTypes.shape({
    type: PropTypes.oneOf(['note']),
    noteHash: PropTypes.string.isRequired,
});

const generalProfileShape = PropTypes.shape({
    type: PropTypes.oneOf(['', 'domain', 'aztec']),
    src: PropTypes.string,
    alt: PropTypes.string,
});

export const profileShape = PropTypes.oneOfType([
    assetProfileShape,
    userProfileShape,
    noteProfileShape,
    generalProfileShape,
]);

export const errorShape = PropTypes.shape({
    key: PropTypes.string,
    message: PropTypes.string,
    response: PropTypes.object,
    fetal: PropTypes.bool,
});

export const gsnConfigShape = PropTypes.shape({
    isGSNAvailable: PropTypes.bool,
    proxyContract: PropTypes.string,
});

export const inputAmountType = PropTypes.number;

export const inputTransactionShape = PropTypes.shape({
    amount: inputAmountType.isRequired,
    to: PropTypes.string.isRequired,
    numberOfOutputNotes: PropTypes.number,
});

export const transactionShape = PropTypes.shape({
    amount: PropTypes.number.isRequired,
    to: PropTypes.string.isRequired,
});

export const rawNoteShape = PropTypes.shape({
    noteHash: PropTypes.string.isRequired,
    k: PropTypes.shape({
        words: PropTypes.arrayOf(PropTypes.number).isRequired,
    }).isRequired,
});

export const animatedBlockType = [
    'linked',
    'overlapped',
    'sealed',
];

export const transactionStepShape = PropTypes.shape({
    name: PropTypes.string.isRequired,
    blockStyle: PropTypes.oneOf(animatedBlockType),
    title: PropTypes.string,
    titleKey: PropTypes.string,
    tasks: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        type: PropTypes.string,
        title: PropTypes.string,
        titleKey: PropTypes.string,
        run: PropTypes.func,
    })),
    Content: PropTypes.func,
    contentProps: PropTypes.object,
    onSubmit: PropTypes.func,
    onGoNext: PropTypes.func,
    cancelText: PropTypes.string,
    cancelTextKey: PropTypes.string,
    submitText: PropTypes.string,
    submitTextKey: PropTypes.string,
});
