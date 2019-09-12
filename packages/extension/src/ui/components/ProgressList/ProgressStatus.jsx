import React from 'react';
import PropTypes from 'prop-types';
import {
    Icon,
} from '@aztec/guacamole-ui';

const statusIconMapping = {
    pending: 'check_circle_outline',
    done: 'check_circle_outline',
    error: 'error_outline',
    loading: 'loop',
};

const statusColorMapping = {
    pending: 'grey-lighter',
    done: 'green',
    error: 'red',
    loading: 'grey-light',
};

const ProgressStatus = ({
    status,
}) => (
    <Icon
        name={statusIconMapping[status]}
        color={statusColorMapping[status]}
        size="xs"
        spin={status === 'loading'}
    />
);

ProgressStatus.propTypes = {
    status: PropTypes.oneOf([
        'pending',
        'done',
        'error',
        'loading',
    ]),
};

ProgressStatus.defaultProps = {
    status: 'pending',
};

export default ProgressStatus;
