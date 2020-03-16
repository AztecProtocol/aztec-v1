import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    FlexBox,
    Text,
    TextButton,
} from '@aztec/guacamole-ui';
import {
    errorShape,
} from '~/ui/config/propTypes';
import i18n from '~/ui/helpers/i18n';
import ConnectionService from '~uiModules/services/ConnectionService';
import Button from '~/ui/components/Button';
import styles from './footer.scss';

const Footer = ({
    cancelText,
    nextText,
    disableOnPrevious,
    disableOnNext,
    loading,
    error,
    onPrevious,
    onNext,
    onRetry,
}) => {
    if (error) {
        const isFetal = error.fetal;
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
                        testId={`button-step-${isFetal ? 'close' : 'retry'}`}
                        theme="underline"
                        text={i18n.t(isFetal ? 'close' : 'retry')}
                        size="m"
                        onClick={!isFetal
                            ? onRetry
                            : () => {
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
                    testId="button-step-previous"
                    className={styles.button}
                    theme="white"
                    size="xl"
                    text={cancelText || i18n.t('cancel')}
                    onSubmit={onPrevious}
                    disabled={loading || disableOnPrevious}
                    expand
                />
            )}
            {!!onNext && (
                <Button
                    testId="button-step-next"
                    className={styles.button}
                    size="xl"
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
    disableOnPrevious: PropTypes.bool,
    disableOnNext: PropTypes.bool,
    loading: PropTypes.bool,
    error: errorShape,
    onPrevious: PropTypes.func,
    onNext: PropTypes.func,
    onRetry: PropTypes.func,
};

Footer.defaultProps = {
    disableOnPrevious: false,
    disableOnNext: false,
    loading: false,
    error: null,
    onPrevious: null,
    onNext: null,
    onRetry: null,
};

export default Footer;
