import React, {
    useState,
    useEffect,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    TextInput,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import Popup from '~ui/components/Popup';

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

const Login = ({
    goNext,
    goBack,
    onClose,
}) => {
    const [password, updatePassword] = useState('');
    const [visible, updateVisible] = useState(false);
    const [inputRef, setInputRef] = useState(null);
    const [didFocusOnce, setFocus] = useState(false);

    useEffect(() => {
        if (inputRef && !didFocusOnce) {
            inputRef.focus();
            setFocus(true);
        }
    });

    return (
        <Popup
            theme="white"
            title={i18n.t('account.login.title')}
            description={i18n.t('account.login.description')}
            leftIconName={goBack ? 'chevron_left' : 'close'}
            onClickLeftIcon={goBack || onClose}
            submitButtonText={i18n.t('account.login')}
            onSubmit={() => goNext({ password })}
        >
            <Block align="left">
                <TextInput
                    setInputRef={setInputRef}
                    theme="inline"
                    type={visible ? 'text' : 'password'}
                    placeholder={i18n.t('account.login.placeholder')}
                    value={password}
                    icon={inputIconMapping[visible ? 'hide' : 'show']}
                    onClickIcon={() => updateVisible(!visible)}
                    onChange={updatePassword}
                />
            </Block>
        </Popup>
    );
};

Login.propTypes = {
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

Login.defaultProps = {
    goBack: null,
    onClose: null,
};

export default Login;
