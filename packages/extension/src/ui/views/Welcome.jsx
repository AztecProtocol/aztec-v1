import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    TextButton,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import {
    startUrl,
} from '~ui/config/settings';
import PopupContent from '~ui/components/PopupContent';
import Logo from '~ui/components/Logo';
import Button from '~ui/components/Button';

const Welcome = ({
    goToPage,
}) => (
    <PopupContent theme="primary">
        <FlexBox
            direction="column"
            align="space-between"
            valign="center"
            stretch
        >
            <Block top="xxl">
                <Logo />
                <Block padding="xl 0">
                    <Text
                        text={i18n.t('account.create.title')}
                        size="l"
                    />
                </Block>
                <Block padding="m 0">
                    <Text
                        text={i18n.t('account.create.description')}
                        size="s"
                    />
                </Block>
                <Block padding="m 0">
                    <Button
                        theme="white"
                        text={i18n.t('account.create')}
                        size="l"
                        onClick={() => {
                            if (window.location === startUrl) {
                                goToPage('register');
                            } else {
                                window.open(startUrl, 'AZTEC_REGISTER');
                            }
                        }}
                        outlined
                    />
                </Block>
            </Block>
            <div>
                <Text
                    text={i18n.t('account.create.already')}
                    size="xxs"
                    color="white-light"
                />
                <Block top="xxs">
                    <TextButton
                        theme="underline"
                        text={i18n.t('account.restore')}
                        color="white-light"
                        size="xxs"
                        onClick={() => goToPage('account.restore')}
                    />
                </Block>
            </div>
        </FlexBox>
    </PopupContent>
);

Welcome.propTypes = {
    goToPage: PropTypes.func.isRequired,
};

export default Welcome;
