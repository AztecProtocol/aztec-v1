import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Link,
} from 'react-router-dom';
import {
    Block,
    TextButton,
    Text,
} from '@aztec/guacamole-ui';
import {
    errorShape,
} from '~/ui/config/propTypes';
import i18n from '~/ui/helpers/i18n';
import styles from './content.scss';

const spacingH = 'xl';

const PopupContent = ({
    className,
    title,
    titleKey,
    description,
    descriptionKey,
    children,
    footerLink,
    error,
}) => {
    const titleText = title
        || (titleKey && i18n.t(titleKey))
        || '';
    const descriptionText = description
        || (descriptionKey && i18n.t(descriptionKey))
        || '';

    return (
        <div
            className={classnames(
                className,
                styles.wrapper,
                {
                    [styles.singleFooter]: !!error ^ !!footerLink, // eslint-disable-line no-bitwise
                    [styles.doubleFooter]: error && footerLink,
                },
            )}
        >
            <Block className={styles.content}>
                {!!(titleText || descriptionText) && (
                    <Block
                        padding={`s ${spacingH}`}
                        align="center"
                    >
                        {!!titleText && (
                            <Block padding="xxs 0">
                                <Text
                                    text={titleText}
                                    size="m"
                                    weight="light"
                                />
                            </Block>
                        )}
                        {!!descriptionText && (
                            <Block padding="s 0">
                                <Text
                                    text={descriptionText}
                                    size="s"
                                    weight="light"
                                />
                            </Block>
                        )}
                    </Block>
                )}
                <Block
                    padding={`0 ${spacingH}`}
                >
                    {children}
                </Block>
            </Block>
            {!!(error || footerLink) && (
                <div className={styles.footer}>
                    {!!error && (
                        <Block
                            className="flex-fixed"
                            padding={`s ${spacingH}`}
                        >
                            <Text
                                text={error.message
                                    || i18n.t(error.key, error.response)}
                                color="red"
                                size="xxs"
                            />
                        </Block>
                    )}
                    {!!footerLink && (
                        <Block
                            className="flex-fixed"
                            padding={`s ${spacingH}`}
                        >
                            <TextButton
                                {...footerLink}
                                Link={Link}
                                color="label"
                                size="xxs"
                            />
                        </Block>
                    )}
                </div>
            )}
        </div>
    );
};

PopupContent.propTypes = {
    className: PropTypes.string,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    titleKey: PropTypes.string,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    descriptionKey: PropTypes.string,
    footerLink: PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        onClick: PropTypes.func,
    }),
    children: PropTypes.node,
    error: errorShape,
};

PopupContent.defaultProps = {
    className: '',
    title: '',
    titleKey: '',
    description: '',
    descriptionKey: '',
    footerLink: null,
    children: null,
    error: null,
};

export default PopupContent;
