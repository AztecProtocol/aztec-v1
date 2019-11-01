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
    icons: PropTypes.arrayOf(PropTypes.shape({
        href: PropTypes.string.isRequired,
        sizes: PropTypes.string,
    })),
});

export const assetShape = PropTypes.shape({
    address: PropTypes.string.isRequired,
    linkedTokenAddress: PropTypes.string.isRequired,
    code: PropTypes.string,
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
