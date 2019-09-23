import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
    TextInput,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import ActionService from '~ui/services/ActionService';
import Popup from '~ui/components/Popup';

class Restore extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            seedPhrase: '',
            errorKey: '',
        };
    }

    handleChangePhrase = (seedPhrase) => {
        this.setState({
            seedPhrase,
            errorKey: '',
        });
    }

    handleResponse = (response) => {
        console.log('Restore successfully!', response);
        const {
            goNext,
        } = this.props;
        goNext();
    };

    handleSubmit = () => {
        if (!this.validateSeedPhrase()) return;

        const {
            seedPhrase,
        } = this.state;

        ActionService.post('restore', { seedPhrase })
            .onReceiveResponse(this.handleResponse);
    };

    validateSeedPhrase() {
        const {
            seedPhrase,
        } = this.state;
        const phrases = seedPhrase
            .split(' ')
            .filter(p => p);

        let errorKey;
        if (!phrases.length) {
            errorKey = 'account.restore.error.seedPhrase.empty';
        } else if (phrases.length !== 12) {
            errorKey = 'account.restore.error.seedPhrase';
        }

        if (errorKey) {
            this.setState({
                errorKey,
            });
            return false;
        }

        return true;
    }

    render() {
        const {
            goBack,
            onClose,
        } = this.props;
        const {
            seedPhrase,
            errorKey,
        } = this.state;

        return (
            <Popup
                theme="white"
                title={i18n.t('account.restore.title')}
                description={i18n.t('account.restore.description')}
                leftIconName={goBack ? 'chevron_left' : 'close'}
                onClickLeftIcon={goBack || onClose}
                submitButtonText={i18n.t('account.restore.confirm')}
                onSubmit={this.handleSubmit}
            >
                <Block align="left">
                    <TextInput
                        type="textarea"
                        rows={3}
                        value={seedPhrase}
                        placeholder={i18n.t('account.restore.input.seedPhrase.placeholder')}
                        onChange={this.handleChangePhrase}
                    />
                </Block>
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

Restore.propTypes = {
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

Restore.defaultProps = {
    goBack: null,
    onClose: null,
};

export default Restore;
