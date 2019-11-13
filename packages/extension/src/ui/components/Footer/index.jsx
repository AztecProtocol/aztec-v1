import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    FlexBox,
    Text,
    TextButton,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';
import ConnectionService from '~uiModules/services/ConnectionService';
import Button from '~ui/components/Button';
import styles from './footer.scss';

const Footer = ({
    cancelText,
    nextText,
    onPrevious,
    onNext,
    disableOnPrevious,
    disableOnNext,
    loading,
    error,
}) => {
    if (error) {
        return (
            <Block padding="m" align="center">
                <Text
                    text={error.message
                      || i18n.t(error.key, error.response)}
                    color="red"
                    size="xxs"
                />
                <Block top="m">
                    <TextButton
                        theme="underline"
                        text={i18n.t('close')}
                        size="m"
                        onClick={() => {
                            ConnectionService.close({
                                abort: true,
                                error,
                            });
                        }}
                    />
                </Block>
            </Block>
        );
    }

    return (
        <FlexBox
            className={styles.footer}
            align="center"
            direction="row"
            valing="center"
            nowrap
        >
            {!!onPrevious && (
                <Button
                    className={styles.button}
                    theme="white"
                    text={cancelText || i18n.t('cancel')}
                    onSubmit={onPrevious}
                    disabled={loading || disableOnPrevious}
                    expand
                />
            )}
            {!!onNext && (
                <Button
                    className={styles.button}
                    text={nextText || i18n.t('next')}
                    onSubmit={onNext}
                    loading={loading}
                    disabled={disableOnNext}
                    expand
                />
            )}
        </FlexBox>
    );
};

Footer.propTypes = {
    cancelText: PropTypes.string.isRequired,
    nextText: PropTypes.string.isRequired,
    onPrevious: PropTypes.func,
    onNext: PropTypes.func,
    disableOnPrevious: PropTypes.bool,
    disableOnNext: PropTypes.bool,
    loading: PropTypes.bool,
    error: PropTypes.shape({
        key: PropTypes.string,
        message: PropTypes.string,
        response: PropTypes.object,
        fetal: PropTypes.bool,
    }),
};

Footer.defaultProps = {
    onPrevious: null,
    onNext: null,
    disableOnPrevious: false,
    disableOnNext: false,
    loading: false,
    error: null,
};

export default Footer;
