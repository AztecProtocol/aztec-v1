import React, {
    useEffect,
    useState,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    TextInput,
    Text,
} from '@aztec/guacamole-ui';
import {
    errorShape,
} from '~/ui/config/propTypes';
import i18n from '~ui/helpers/i18n';
import formatAddress from '~ui/utils/formatAddress';
import PopupContent from '~ui/components/PopupContent';
import ProfileIcon from '~ui/components/ProfileIcon';

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

const LoginWithPassword = ({
    address,
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
            theme="white"
            error={error}
        >
            <Block align="left">
                <Block padding="s s xl s" align="center">
                    <Text
                        text={i18n.t('account.login.description')}
                        size="s"
                        weight="light"
                        textAlign="center"

                    />
                </Block>
                <Block
                    top="l"
                    bottom="l"
                    align="center"
                >
                    <ProfileIcon
                        type="user"
                        address={address}
                    />
                    <Block
                        top="m"
                        bottom="m"
                    >
                        <Text
                            className="text-code"
                            text={formatAddress(address, 16, 10)}
                            color="label"
                            size="xxs"
                        />
                    </Block>
                </Block>
                <TextInput
                    setInputRef={setInputRef}
                    theme="inline"
                    type={visible ? 'text' : 'password'}
                    placeholder={i18n.t('account.login.password.placeholder')}
                    value={password}
                    icon={inputIconMapping[visible ? 'hide' : 'show']}
                    onClickIcon={() => updateVisible(!visible)}
                    onChange={(val) => {
                        updateParentState({
                            password: val,
                            error: null,
                        });
                    }}
                />
            </Block>
        </PopupContent>
    );
};

LoginWithPassword.propTypes = {
    address: PropTypes.string.isRequired,
    password: PropTypes.string,
    updateParentState: PropTypes.func.isRequired,
    error: errorShape,
};

LoginWithPassword.defaultProps = {
    password: '',
    error: null,
};

export default LoginWithPassword;
