import PropTypes from 'prop-types';

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
    linkedTokenAddress: PropTypes.string.isRequired,
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
]);

const assetProfileShape = PropTypes.shape({
    type: PropTypes.oneOf(['asset', 'token']),
    address: PropTypes.string.isRequired,
    linkedTokenAddress: PropTypes.string.isRequired,
});

const userProfileShape = PropTypes.shape({
    type: PropTypes.oneOf(['user']),
    address: PropTypes.string.isRequired,
    src: PropTypes.string,
});

const generalProfileShape = PropTypes.shape({
    type: PropTypes.oneOf(['', 'domain', 'aztec']),
    src: PropTypes.string,
    alt: PropTypes.string,
});

export const profileShape = PropTypes.oneOfType([
    assetProfileShape,
    userProfileShape,
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
