import React, {
    useState,
} from 'react';
import PropTypes from 'prop-types';
import {
    TextInput,
} from '@aztec/guacamole-ui';

const inputIconMapping = {
    show: {
        name: 'visibility',
        color: 'grey-light',
        size: 'm',
    },
    hide: {
        name: 'visibility_off',
        color: 'grey-light',
        size: 'm',
    },
};

const PasswordInput = ({
    size,
    value,
    status,
    onChange,
    setInputRef,
}) => {
    const [visible, updateVisible] = useState(false);

    return (
        <TextInput
            setInputRef={setInputRef}
            theme="inline"
            type={visible ? 'text' : 'password'}
            size={size}
            value={value}
            status={status}
            icon={inputIconMapping[visible ? 'hide' : 'show']}
            onClickIcon={() => updateVisible(!visible)}
            onChange={onChange}
        />
    );
};

PasswordInput.propTypes = {
    size: PropTypes.string,
    value: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['error', '']),
    onChange: PropTypes.func.isRequired,
    setInputRef: PropTypes.func,
};

PasswordInput.defaultProps = {
    size: 'l',
    status: '',
    setInputRef: null,
};

export default PasswordInput;
