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
import PopupContent from '~ui/components/PopupContent';
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
    title,
    description,
    submitButtonText,
    footerLink,
    goBack,
    onClose,
    updateParentState,
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
        <PopupContent
            theme="white"
            title={title || i18n.t('register.create.password.title')}
            description={description || i18n.t('register.create.password.description')}
            leftIconName={goBack ? 'chevron_left' : 'close'}
            onClickLeftIcon={goBack || onClose}
            submitButtonText={submitButtonText || i18n.t('next')}
            onSubmit={() => {
                if (!password) {
                    setError(i18n.t('account.password.error.empty'));
                }
            }}
            footerLink={footerLink}
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
                        updateParentState({ password: p });
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
        </PopupContent>
    );
};

CreatePassword.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    submitButtonText: PropTypes.string,
    footerLink: PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
    }),
    goBack: PropTypes.func,
    onClose: PropTypes.func,
    updateParentState: PropTypes.func.isRequired,
};

CreatePassword.defaultProps = {
    title: '',
    description: '',
    submitButtonText: '',
    footerLink: null,
    goBack: null,
    onClose: null,
};

export default CreatePassword;
