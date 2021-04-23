import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';
import isStepAfter from '~/ui/utils/isStepAfter';
import StepContentHelper from '~/ui/views/handlers/StepContentHelper';
import StepContent from '~/ui/components/StepContent';
import AnimatedBlocks from '~/ui/components/AnimatedBlocks';
import HashText from '~/ui/components/HashText';
import SignatureRequestBlock from '~/ui/components/SignatureRequestBlock';
import PasswordInput from '~/ui/components/PasswordInput';
import PasswordMeter from '~/ui/components/PasswordMeter';

class RegisterContent extends StepContentHelper {
    componentDidMount() {
        const step = this.getCurrentStep();
        if (step.name === 'create' && this.input) {
            this.input.focus();
        }
    }

    getBlockConfig() {
        const {
            address,
            AZTECaddress,
        } = this.props;

        return [
            {
                title: i18n.t('account.ethereum'),
                content: (
                    <HashText
                        text={address}
                        size="xs"
                        prefixLength={10}
                        suffixLength={4}
                        clickToCopy
                    />
                ),
                profile: {
                    type: 'metamask',
                },
            },
            {
                title: i18n.t('account.aztec'),
                content: (
                    <HashText
                        text={AZTECaddress}
                        size="xs"
                        prefixLength={10}
                        suffixLength={4}
                        clickToCopy
                    />
                ),
                profile: {
                    type: 'aztec',
                },
            },
        ];
    }

    setInputRef = (ref) => {
        this.input = ref;
    };

    handleChangePassword = (password) => {
        this.clearError();
        this.updateData({
            password,
        });
    };

    validateSubmitData() {
        const step = this.getCurrentStep();
        const {
            data,
        } = this.state;
        if (step.name === 'create'
            && (!data.password || !data.password.trim())
        ) {
            return {
                key: 'account.password.error.empty',
            };
        }

        return null;
    }

    renderSignature() {
        const {
            address,
            AZTECaddress,
            linkedPublicKey,
            loading,
        } = this.props;
        const step = this.getCurrentStep();
        const signed = step.name === 'confirm';
        const signatures = {
            account: address,
            AZTECaddress,
            linkedPublicKey,
        };

        return (
            <SignatureRequestBlock
                signatures={signatures}
                signed={signed}
                loading={loading && !signed}
            />
        );
    }

    renderCreatePassword() {
        const {
            data: {
                password,
            },
            error,
        } = this.state;

        return (
            <div>
                <Block padding="xxs 0">
                    <Text
                        text={i18n.t('account.create.password')}
                        size="xxs"
                        color="grey-dark"
                    />
                </Block>
                <Block padding="xs 0">
                    <PasswordInput
                        setInputRef={this.setInputRef}
                        value={password || ''}
                        onChange={this.handleChangePassword}
                        status={error ? 'error' : ''}
                    />
                </Block>
                {!!password && (
                    <Block padding="xs xxs">
                        <PasswordMeter
                            password={password}
                        />
                    </Block>
                )}
            </div>
        );
    }

    render() {
        const {
            steps,
        } = this.props;
        const {
            name: currentStepName,
            blockStyle,
            showTaskList,
        } = this.getCurrentStep();
        const stepConfig = this.getStepConfig();

        let contentNode;
        if (currentStepName === 'create') {
            contentNode = this.renderCreatePassword();
        } else {
            const blocks = this.getBlockConfig();
            contentNode = (
                <AnimatedBlocks
                    type={blockStyle}
                    blocks={blocks}
                    sealedIcon="link"
                />
            );
        }

        const showSignature = isStepAfter(steps, currentStepName, 'link')
            && !isStepAfter(steps, currentStepName, 'confirm');

        return (
            <StepContent
                {...stepConfig}
            >
                <Block bottom="l">
                    <Text
                        size="s"
                        color="red"
                    >
                        {'This project has been deprecated. Creating a new account is not encouraged.'}
                    </Text>
                </Block>
                {contentNode}
                {showSignature && (
                    <Block top="xl" bottom="s">
                        {this.renderSignature()}
                    </Block>
                )}
                {showTaskList && this.renderTaskList()}
            </StepContent>
        );
    }
}

RegisterContent.propTypes = {
    address: PropTypes.string.isRequired,
    linkedPublicKey: PropTypes.string,
    AZTECaddress: PropTypes.string,
};

RegisterContent.defaultProps = {
    titleKey: 'account.create.title',
    linkedPublicKey: '',
    AZTECaddress: '',
};

export default RegisterContent;
