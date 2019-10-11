import PropTypes from 'prop-types';

export const themeType = PropTypes.oneOf([
    'primary',
    'white',
]);

export const assetShape = PropTypes.shape({
    address: PropTypes.string.isRequired,
    tokenAddress: PropTypes.string.isRequired,
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
    tokenAddress: PropTypes.string.isRequired,
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
