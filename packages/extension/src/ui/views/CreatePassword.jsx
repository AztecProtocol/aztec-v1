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
    password,
    updateParentState,
    error,
}) => {
    const [visible, updateVisible] = useState(false);
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
        >
            <Block align="left">
                <Block padding="s s xl s" align="center">
                    <Text
                        text={i18n.t('register.create.password.description')}
                        size="s"
                        weight="light"
                        textAlign="center"

                    />
                </Block>
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
                {!!error && (
                    <Block top="s">
                        <Text
                            text={error.message
                              || i18n.t(error.key, error.response)}
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
    password: PropTypes.string,
    updateParentState: PropTypes.func.isRequired,
    error: PropTypes.shape({
        key: PropTypes.string,
        message: PropTypes.string,
        response: PropTypes.object,
        fetal: PropTypes.bool,
    }),
};

CreatePassword.defaultProps = {
    title: '',
    description: '',
    password: '',
    error: null,
};

export default CreatePassword;
