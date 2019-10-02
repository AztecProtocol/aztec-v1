import PropTypes from 'prop-types';

export const themeType = PropTypes.oneOf([
    'primary',
    'white',
]);

export const assetType = PropTypes.shape({
    address: PropTypes.string.isRequired,
    code: PropTypes.string,
    icon: PropTypes.string,
});

export const profileType = PropTypes.oneOf([
    '',
    'token',
    'asset',
    'user',
]);
