import React, {
    useEffect,
    useState,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    TextInput,
} from '@aztec/guacamole-ui';
import {
    errorShape,
} from '~/ui/config/propTypes';
import i18n from '~/ui/helpers/i18n';
import PopupContent from '~/ui/components/PopupContent';
import PasswordMeter from '~/ui/components/PasswordMeter';

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

const CreatePassword = ({
    password,
    updateParentState,
    error,
}) => {
    const [visible, updateVisible] = useState(false);
    const [inputRef, setInputRef] = useState(null);
    const [didMount, doMount] = useState(false);

    useEffect(() => {
        if (inputRef && !didMount) {
            inputRef.focus();
            doMount(true);
        }
    });

    return (
        <PopupContent
            descriptionKey="register.create.password.description"
            error={error}
        >
            <Block align="left">
                <TextInput
                    setInputRef={setInputRef}
                    theme="inline"
                    type={visible ? 'text' : 'password'}
                    placeholder={i18n.t('register.create.password.placeholder')}
                    value={password}
                    icon={inputIconMapping[visible ? 'hide' : 'show']}
                    onClickIcon={() => updateVisible(!visible)}
                    onChange={(p) => {
                        updateParentState({
                            password: p,
                            error: null,
                        });
                    }}
                />
                {password !== '' && (
                    <Block padding="m xxs">
                        <PasswordMeter
                            password={password}
                        />
                    </Block>
                )}
            </Block>
        </PopupContent>
    );
};

CreatePassword.propTypes = {
    password: PropTypes.string,
    updateParentState: PropTypes.func.isRequired,
    error: errorShape,
};

CreatePassword.defaultProps = {
    password: '',
    error: null,
};

export default CreatePassword;
