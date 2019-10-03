import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    TextInput,
    Text,
} from '@aztec/guacamole-ui';
import {
    randomInts,
} from '~utils/random';
import i18n from '~ui/helpers/i18n';
import Popup from '~ui/components/Popup';

class ConfirmBackup extends PureComponent {
    constructor(props) {
        super(props);

        const {
            seedPhrase,
            numberOfPhrases,
        } = props;

        this.seedPhraseSize = seedPhrase.split(' ').length;

        this.state = {
            inputPos: randomInts(numberOfPhrases, 1, this.seedPhraseSize),
            inputPhrases: [],
            errorKey: '',
        };
    }

    handleSubmit = () => {
        const {
            seedPhrase,
            goNext,
            numberOfPhrases,
        } = this.props;
        const {
            inputPos,
            inputPhrases,
        } = this.state;
        const phrases = seedPhrase.split(' ');
        const wrongPhrase = inputPos.find((pos, i) => !inputPhrases[i]
            || inputPhrases[i].trim() !== phrases[pos - 1]);
        if (wrongPhrase && process.env.NODE_ENV !== 'development') {
            this.setState({
                inputPos: randomInts(numberOfPhrases, 1, this.seedPhraseSize),
                inputPhrases: [],
                errorKey: 'register.backup.confirm.wrong.phrases',
            });
        } else {
            goNext();
        }
    };

    handleChangePhrase(idx, phrase) {
        const {
            inputPhrases: prevPhrases,
        } = this.state;
        const inputPhrases = [...prevPhrases];
        inputPhrases[idx] = phrase;

        this.setState({
            inputPhrases,
            errorKey: '',
        });
    }

    render() {
        const {
            goBack,
            onClose,
        } = this.props;
        const {
            inputPos,
            inputPhrases,
            errorKey,
        } = this.state;
        const ordinals = inputPos.map(pos => i18n.ordinal(pos));
        const descriptionOptions = {};
        ordinals.forEach((ordinal, i) => {
            descriptionOptions[`pos${i}`] = ordinal;
        });

        return (
            <Popup
                theme="white"
                title={i18n.t('register.backup.confirm.title')}
                description={i18n.t('register.backup.confirm.description', descriptionOptions)}
                leftIconName={goBack ? 'chevron_left' : 'close'}
                onClickLeftIcon={goBack || onClose}
                submitButtonText={i18n.t('register.backup.complete')}
                onSubmit={this.handleSubmit}
            >
                <div>
                    {inputPos.map((pos, i) => (
                        <Block
                            key={`input-${pos}`}
                            padding="s 0"
                        >
                            <TextInput
                                theme="inline"
                                placeholder={ordinals[i]}
                                value={inputPhrases[i] || ''}
                                onChange={v => this.handleChangePhrase(i, v)}
                            />
                        </Block>
                    ))}
                    {!!errorKey && (
                        <Block top="s">
                            <Text
                                text={i18n.t(errorKey)}
                                color="red"
                                size="xxs"
                            />
                        </Block>
                    )}
                </div>
            </Popup>
        );
    }
}

ConfirmBackup.propTypes = {
    seedPhrase: PropTypes.string.isRequired,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
    numberOfPhrases: PropTypes.number,
};

ConfirmBackup.defaultProps = {
    goBack: null,
    onClose: null,
    numberOfPhrases: 3,
};

export default ConfirmBackup;
