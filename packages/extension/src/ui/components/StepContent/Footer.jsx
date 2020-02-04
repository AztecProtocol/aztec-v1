import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
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
import styles from './content.scss';

class Footer extends PureComponent {
    static getDerivedStateFromProps(nextProps, prevState) {
        const {
            error,
            submitMessage,
        } = nextProps;
        const {
            prevError,
            prevSubmitMessage,
        } = prevState;
        const nextState = {};
        if (error && !prevError) {
            nextState.nextError = error;
        }
        if (submitMessage && !prevSubmitMessage) {
            nextState.nextSubmitMessage = submitMessage;
        }

        return nextState;
    }

    constructor(props) {
        super(props);

        this.transitionInterval = 300;

        const {
            error,
            submitMessage,
        } = props;

        this.state = {
            prevError: error,
            prevSubmitMessage: submitMessage,
            nextError: null,
            nextSubmitMessage: '',
        };
    }

    componentDidMount() {
        this.continueAnimation();
    }

    componentDidUpdate() {
        this.continueAnimation();
    }

    continueAnimation() {
        const {
            nextError,
            nextSubmitMessage,
        } = this.state;

        let nextState;
        if (nextError) {
            nextState = {
                nextError: '',
                prevError: nextError,
            };
        } else if (nextSubmitMessage) {
            nextState = {
                nextSubmitMessage: '',
                prevSubmitMessage: nextSubmitMessage,
            };
        }

        if (!nextState) return;

        setTimeout(() => {
            this.setState(nextState);
        }, this.transitionInterval);
    }

    renderError() {
        const {
            error: currentError,
            onRetry,
        } = this.props;
        const {
            prevError,
            nextError,
        } = this.state;

        let error = nextError || currentError || prevError;
        if (!error) {
            return null;
        }

        if (!error.message) {
            error = {
                ...error,
                message: i18n.t(error.key, error.response),
            };
        }

        const isFetal = error.fetal;

        return (
            <Block
                key="error"
                className={classnames(
                    styles['footer-content'],
                    {
                        [styles.hide]: nextError || !currentError,
                    },
                )}
                padding="xs"
            >
                <Text
                    text={error.message}
                    color="red"
                    size="xxs"
                />
                <Block top="xxs">
                    <TextButton
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

    renderSubmitMessage() {
        const {
            submitMessage: currentSubmitMessage,
            error,
        } = this.props;
        const {
            prevSubmitMessage,
            nextSubmitMessage,
            nextError,
        } = this.state;

        const submitMessage = nextSubmitMessage || currentSubmitMessage || prevSubmitMessage;
        if (!submitMessage) {
            return null;
        }

        return (
            <Block
                key="submit-message"
                className={classnames(
                    styles['footer-content'],
                    {
                        [styles.hide]: nextSubmitMessage
                            || !currentSubmitMessage
                            || error
                            || nextError,
                    },
                )}
                padding="m"
                align="center"
            >
                <Text
                    text={submitMessage}
                    size="xxs"
                />
            </Block>
        );
    }

    renderButtons() {
        const {
            prevText,
            nextText,
            disableOnPrevious,
            disableOnNext,
            loading,
            error,
            submitMessage,
            onPrevious,
            onNext,
        } = this.props;

        return (
            <FlexBox
                key="buttons"
                className={classnames(
                    styles['footer-content'],
                    {
                        [styles.hide]: error || submitMessage,
                    },
                )}
                align="center"
                direction="row"
                valing="center"
                nowrap
                expand
            >
                {!!(onPrevious && prevText) && (
                    <Button
                        className={styles['footer-button']}
                        theme="white"
                        text={prevText}
                        onSubmit={onPrevious}
                        disabled={loading || disableOnPrevious}
                        expand
                    />
                )}
                {!!(onNext && nextText) && (
                    <Button
                        className={styles['footer-button']}
                        text={nextText}
                        onSubmit={onNext}
                        loading={loading}
                        disabled={disableOnNext}
                        expand
                    />
                )}
            </FlexBox>
        );
    }

    render() {
        return (
            <FlexBox
                className={styles.footer}
                align="center"
                valing="center"
            >
                {this.renderError()}
                {this.renderSubmitMessage()}
                {this.renderButtons()}
            </FlexBox>
        );
    }
}

Footer.propTypes = {
    prevText: PropTypes.string,
    nextText: PropTypes.string,
    submitMessage: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]),
    disableOnPrevious: PropTypes.bool,
    disableOnNext: PropTypes.bool,
    onPrevious: PropTypes.func,
    onNext: PropTypes.func,
    onRetry: PropTypes.func,
    loading: PropTypes.bool,
    error: errorShape,
};

Footer.defaultProps = {
    prevText: '',
    nextText: '',
    submitMessage: '',
    disableOnPrevious: false,
    disableOnNext: false,
    onPrevious: null,
    onNext: null,
    onRetry: null,
    loading: false,
    error: null,
};

export default Footer;
