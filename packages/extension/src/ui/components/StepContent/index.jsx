import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Link,
} from 'react-router-dom';
import {
    FlexBox,
    Block,
    TextButton,
    Text,
} from '@aztec/guacamole-ui';
import {
    errorShape,
} from '~/ui/config/propTypes';
import i18n from '~/ui/helpers/i18n';
import Footer from './Footer';
import styles from './content.scss';

const spacingH = 'xl';

const StepContent = ({
    title,
    titleKey,
    description,
    descriptionKey,
    cancelText,
    cancelTextKey,
    submitText,
    submitTextKey,
    submitType,
    submitMessage,
    children,
    footnote,
    disableOnPrevious,
    disableOnNext,
    loading,
    hideFooter,
    error,
    childError,
    onPrevious,
    onNext,
    onRetry,
}) => {
    const titleText = title
        || (titleKey && i18n.t(titleKey))
        || '';
    const descriptionText = description
        || (descriptionKey && i18n.t(descriptionKey))
        || '';

    return (
        <div className={styles.wrapper}>
            <FlexBox
                direction="column"
                expand
                stretch
                nowrap
            >
                <div
                    className={classnames(
                        styles['content-wrapper'],
                        {
                            [styles.singleFootnote]: !!childError ^ !!footnote, // eslint-disable-line no-bitwise
                            [styles.doubleFootnote]: childError && footnote,
                        },
                    )}
                >
                    <Block
                        className={styles.content}
                        padding={`0 ${spacingH}`}
                        align="left"
                    >
                        {!!(titleText || descriptionText) && (
                            <Block padding="s 0">
                                {!!titleText && (
                                    <Block padding="xs 0">
                                        <Text
                                            text={titleText}
                                            size="l"
                                        />
                                    </Block>
                                )}
                                {!!descriptionText && (
                                    <Block padding="s 0">
                                        <Text
                                            text={descriptionText}
                                            size="xs"
                                            weight="light"
                                            color="grey"
                                        />
                                    </Block>
                                )}
                            </Block>
                        )}
                        {!!children && (
                            <Block padding="s 0">
                                {children}
                            </Block>
                        )}
                    </Block>
                    {!!(childError || footnote) && (
                        <Block
                            className={styles['footnote-wrapper']}
                            padding={`0 ${spacingH}`}
                        >
                            {!!childError && (
                                <Block
                                    className="flex-fixed"
                                    padding="s 0"
                                >
                                    <Text
                                        text={childError.message
                                            || i18n.t(childError.key, childError.response)}
                                        color="red"
                                        size="xxs"
                                    />
                                </Block>
                            )}
                            {!!footnote && (
                                <Block
                                    className="flex-fixed"
                                    padding="s 0"
                                >
                                    <TextButton
                                        {...footnote}
                                        testId="link-footer"
                                        Link={Link}
                                        color="label"
                                        size="xxs"
                                    />
                                </Block>
                            )}
                        </Block>
                    )}
                </div>
                {!hideFooter && (
                    <Footer
                        prevText={cancelText
                            || (cancelTextKey && i18n.t(cancelTextKey))
                            || ''}
                        nextText={submitText
                            || (submitTextKey && i18n.t(submitTextKey))
                            || ''}
                        submitType={submitType}
                        submitMessage={submitMessage}
                        disableOnPrevious={disableOnPrevious}
                        disableOnNext={disableOnNext}
                        loading={loading}
                        error={error}
                        onPrevious={onPrevious}
                        onNext={onNext}
                        onRetry={onRetry}
                    />
                )}
            </FlexBox>
        </div>
    );
};

StepContent.propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    titleKey: PropTypes.string,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    descriptionKey: PropTypes.string,
    submitText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    submitTextKey: PropTypes.string,
    submitType: PropTypes.oneOf([
        '',
        'sign',
    ]),
    submitMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    cancelText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    cancelTextKey: PropTypes.string,
    children: PropTypes.node,
    footnote: PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        onClick: PropTypes.func,
    }),
    disableOnPrevious: PropTypes.bool,
    disableOnNext: PropTypes.bool,
    onPrevious: PropTypes.func,
    onNext: PropTypes.func,
    onRetry: PropTypes.func,
    loading: PropTypes.bool,
    hideFooter: PropTypes.bool,
    error: errorShape,
    childError: errorShape,
};

StepContent.defaultProps = {
    title: '',
    titleKey: '',
    description: '',
    descriptionKey: '',
    cancelText: '',
    cancelTextKey: '',
    submitText: '',
    submitTextKey: '',
    submitType: '',
    submitMessage: '',
    footnote: null,
    children: null,
    disableOnPrevious: false,
    disableOnNext: false,
    onPrevious: null,
    onNext: null,
    onRetry: null,
    loading: false,
    hideFooter: false,
    error: null,
    childError: null,
};

export default StepContent;
