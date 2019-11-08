import React, {
    useState,
    useEffect,
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
import PopupContent from '~ui/components/PopupContent';
import ProfileIcon from '~ui/components/ProfileIcon';

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
    updateParentState,
}) => {
    const [seedPhrase, updateSeedPhrase] = useState('');
    const [error, updateError] = useState(null);

    useEffect(() => {
        updateParentState({ seedPhrase });
    }, [seedPhrase]);

    return (
        <PopupContent
            theme="white"
            footerLink={isLinked
                ? null
                : {
                    text: i18n.t('account.create'),
                    href: router.u('register'),
                }}
            error={error}
        >
            <Block
                padding="l"
            >
                <Text text={i18n.t('account.restore.description')} size="s" />
            </Block>
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
        </PopupContent>
    );
};

RestoreFromSeedPhrase.propTypes = {
    address: PropTypes.string.isRequired,
    updateParentState: PropTypes.func.isRequired,
    isLinked: PropTypes.bool,
};

RestoreFromSeedPhrase.defaultProps = {
    isLinked: false,
    submitButtonText: '',
};

export default RestoreFromSeedPhrase;
