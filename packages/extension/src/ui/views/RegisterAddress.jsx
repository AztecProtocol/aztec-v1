import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import ActionService from '~ui/services/ActionService';
import Popup from '~ui/components/Popup';
import Ticket from '~ui/components/Ticket';
import ProgressList from '~ui/components/ProgressList';
import AddressRow from '~ui/components/AddressRow';

class RegisterAddress extends PureComponent {
    constructor(props) {
        super(props);

        const {
            initialStep,
        } = props;

        this.state = {
            currentStep: initialStep,
            errorKey: '',
        };

        this.steps = [
            {
                title: i18n.t('register.address.step.authorise'),
            },
            {
                title: i18n.t('transaction.step.send'),
            },
            {
                title: i18n.t('transaction.step.confirmed'),
            },
        ];
    }

    handleResponse = (response) => {
        console.log(response);
        const {
            goNext,
        } = this.props;
        goNext();
    };

    handleSubmit = () => {
        console.log('handleSubmit');
        const {
            seedPhrase,
        } = this.state;

        ActionService.post('restore', { seedPhrase })
            .onReceiveResponse(this.handleResponse);
    };

    renderAccount() {
        const {
            address,
        } = this.props;

        return (
            <div>
                <Block bottom="l">
                    <Text
                        text={i18n.t('register.link.account')}
                        color="primary"
                    />
                </Block>
                <Block padding="xs 0">
                    <AddressRow
                        address={address}
                    />
                </Block>
            </div>
        );
    }

    renderSteps() {
        const {
            currentStep,
        } = this.state;

        return (
            <ProgressList
                steps={this.steps}
                currentStep={currentStep}
            />
        );
    }

    render() {
        const {
            goBack,
            onClose,
        } = this.props;
        const {
            errorKey,
        } = this.state;

        return (
            <Popup
                theme="white"
                title={i18n.t('register.address.title')}
                description={i18n.t('register.address.description')}
                leftIconName={goBack ? 'chevron_left' : 'close'}
                onClickLeftIcon={goBack || onClose}
                submitButtonText={i18n.t('register')}
                onSubmit={this.handleSubmit}
            >
                <Ticket
                    header={this.renderAccount()}
                    height={6}
                >
                    {this.renderSteps()}
                </Ticket>
                {!!errorKey && (
                    <Block top="s">
                        <Text
                            text={i18n.t(errorKey)}
                            color="red"
                            size="xxs"
                        />
                    </Block>
                )}
            </Popup>
        );
    }
}

RegisterAddress.propTypes = {
    address: PropTypes.string.isRequired,
    initialStep: PropTypes.number,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

RegisterAddress.defaultProps = {
    initialStep: -1,
    goBack: null,
    onClose: null,
};

export default RegisterAddress;
