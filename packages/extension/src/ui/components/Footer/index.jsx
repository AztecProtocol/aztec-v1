import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    FlexBox,
    Text,
    TextButton,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';
import ConnectionService from '~/ui/services/ConnectionService';
import Button from '~ui/components/Button';
import styles from './footer.scss';

const Footer = ({
    cancelText,
    onNext,
    onPrevious,
    nextText,
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
            align="center"
            direction="row"
            valing="center"
            className={styles.footer}
        >
            <Button
                className={styles['cancel-button']}
                text={cancelText}
                onClick={onPrevious}
            />
            <Button
                className={styles['next-button']}
                text={nextText}
                onClick={() => {
                    onNext();
                }}
                loading={loading}
            />
        </FlexBox>
    );
};

Footer.propTypes = {
    onNext: PropTypes.func.isRequired,
    nextText: PropTypes.string.isRequired,
    cancelText: PropTypes.string.isRequired,
    onPrevious: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    error: PropTypes.shape({
        key: PropTypes.string,
        message: PropTypes.string,
        response: PropTypes.object,
        fetal: PropTypes.bool,
    }),
};

Footer.defaultProps = {
    loading: false,
    error: null,
};

export default Footer;
