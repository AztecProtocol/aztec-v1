import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    TextInput,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import apis from '~uiModules/apis';
import formatAddress from '~ui/utils/formatAddress';
import Popup from '~ui/components/Popup';
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

class LoginTransaction extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            password: '',
            visible: false,
            error: null,
            success: false,
        };

        this.input = null;
    }

    componentDidMount() {
        this.focusInput();
    }

    setInputRef = (ref) => {
        this.input = ref;
    };

    toggleVisible = () => {
        const {
            visible,
        } = this.state;
        this.setState({
            visible: !visible,
        });
    };

    handleChangePassword = (password) => {
        const {
            loading,
        } = this.state;
        if (loading) return;

        this.setState({
            password,
            error: null,
        });
    };

    handleSubmit = () => {
        this.setState(
            {
                loading: true,
            },
            this.login,
        );
    };

    focusInput() {
        if (this.input) {
            this.input.focus();
        }
    }

    async login() {
        const {
            currentAccount,
            goNext,
        } = this.props;
        const {
            password,
        } = this.state;
        const {
            address,
        } = currentAccount;

        const loggedIn = await apis.auth.login({
            address,
            password,
        });

        this.setState({
            loading: false,
        });

        if (!loggedIn) {
            this.setState(
                {
                    error: {
                        key: 'account.password.error.incorrect',
                    },
                },
                this.focusInput,
            );
        } else {
            this.setState(
                {
                    success: true,
                },
                () => goNext({
                    loggedIn,
                }),
            );
        }
    }

    render() {
        const {
            currentAccount,
            goBack,
            onClose,
        } = this.props;
        const {
            password,
            visible,
            loading,
            error,
            success,
        } = this.state;
        const {
            address,
        } = currentAccount;

        return (
            <Popup
                theme="white"
                title={i18n.t('account.login.title')}
                description={i18n.t('account.login.description')}
                leftIconName={goBack ? 'chevron_left' : 'close'}
                onClickLeftIcon={goBack || onClose}
                submitButtonText={i18n.t('account.login')}
                onSubmit={this.handleSubmit}
                loading={loading}
                success={success}
                error={error}
            >
                <Block
                    top="l"
                    bottom="l"
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
                <Block align="left">
                    <TextInput
                        setInputRef={this.setInputRef}
                        theme="inline"
                        type={visible ? 'text' : 'password'}
                        placeholder={i18n.t('account.login.placeholder')}
                        value={password}
                        icon={inputIconMapping[visible ? 'hide' : 'show']}
                        onClickIcon={this.toggleVisible}
                        onChange={this.handleChangePassword}
                    />
                </Block>
            </Popup>
        );
    }
}

LoginTransaction.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

LoginTransaction.defaultProps = {
    goBack: null,
    onClose: null,
};

export default LoginTransaction;
