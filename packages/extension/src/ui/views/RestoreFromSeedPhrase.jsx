import React, {
    useState,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    TextInput,
    Text,
} from '@aztec/guacamole-ui';
import {
    validateMnemonic,
} from '~utils/keyvault';
import i18n from '~ui/helpers/i18n';
import router from '~ui/helpers/router';
import formatAddress from '~ui/utils/formatAddress';
import Popup from '~ui/components/Popup';
import ProfileSvg from '~ui/components/ProfileSvg';

const validateSeedPhrase = (seedPhrase) => {
    const phrases = seedPhrase
        .split(' ')
        .filter(p => p);

    let errorKey;
    if (!phrases.length) {
        errorKey = 'account.restore.error.seedPhrase.empty';
    } else if (!validateMnemonic(seedPhrase)) {
        errorKey = 'account.restore.error.seedPhrase';
    }

    return errorKey;
};

const RestoreFromSeedPhrase = ({
    address,
    isLinked,
    submitButtonText,
    goNext,
    goBack,
    onClose,
}) => {
    const [seedPhrase, updateSeedPhrase] = useState('');
    const [error, updateError] = useState(null);

    const handleSubmit = () => {
        const errorKey = validateSeedPhrase(seedPhrase);
        if (errorKey) {
            updateError({
                key: errorKey,
                message: i18n.t(errorKey),
            });
        } else {
            goNext({
                seedPhrase,
            });
        }
    };

    return (
        <Popup
            theme="white"
            title={i18n.t('account.restore.title')}
            description={i18n.t(isLinked
                ? 'account.restore.description'
                : 'account.restore.link.description')}
            leftIconName={goBack ? 'chevron_left' : 'close'}
            onClickLeftIcon={goBack || onClose}
            submitButtonText={submitButtonText || i18n.t('account.restore.confirm')}
            onSubmit={handleSubmit}
            footerLink={isLinked
                ? null
                : {
                    text: i18n.t('account.create'),
                    href: router.u('register'),
                }}
            error={error}
        >
            <Block
                top="l"
                bottom="l"
            >
                <ProfileSvg
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
                    type="textarea"
                    rows={3}
                    value={seedPhrase}
                    placeholder={i18n.t('account.restore.input.seedPhrase.placeholder')}
                    onChange={(val) => {
                        if (error) {
                            updateError(null);
                        }
                        updateSeedPhrase(val);
                    }}
                />
            </Block>
        </Popup>
    );
};

RestoreFromSeedPhrase.propTypes = {
    address: PropTypes.string.isRequired,
    isLinked: PropTypes.bool,
    submitButtonText: PropTypes.string,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

RestoreFromSeedPhrase.defaultProps = {
    isLinked: false,
    submitButtonText: '',
    goBack: null,
    onClose: null,
};

export default RestoreFromSeedPhrase;
