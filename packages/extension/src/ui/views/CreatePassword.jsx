import React, {
    useState,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    TextInput,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import Popup from '~ui/components/Popup';
import PasswordMeter from '~ui/components/PasswordMeter';

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
    goNext,
    goBack,
    onClose,
}) => {
    const [password, updatePassword] = useState('');
    const [visible, updateVisible] = useState(false);
    const [error, setError] = useState('');
    const [inputRef, setInputRef] = useState(null);
    const [didMount, doMount] = useState(false);

    if (inputRef && !didMount) {
        inputRef.focus();
        doMount(true);
    }

    return (
        <Popup
            theme="white"
            title={i18n.t('register.create.password.title')}
            description={i18n.t('register.create.password.description')}
            leftIconName={goBack ? 'chevron_left' : 'close'}
            onClickLeftIcon={goBack || onClose}
            submitButtonText={i18n.t('next')}
            onSubmit={() => {
                if (!password) {
                    setError(i18n.t('account.password.error.empty'));
                } else {
                    goNext({ password });
                }
            }}
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
                        updatePassword(p);
                        setError('');
                    }}
                />
                {password !== '' && (
                    <Block top="l" bottom="s">
                        <PasswordMeter
                            password={password}
                        />
                    </Block>
                )}
                {!!error && (
                    <Block top="s">
                        <Text
                            text={error}
                            color="red"
                            size="xxs"
                        />
                    </Block>
                )}
            </Block>
        </Popup>
    );
};

CreatePassword.propTypes = {
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

CreatePassword.defaultProps = {
    goBack: null,
    onClose: null,
};

export default CreatePassword;
