import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    profileShape,
} from '~/ui/config/propTypes';
import ListItem from '~/ui/components/ListItem';
import styles from './blocks.scss';

const EntityBlock = ({
    className,
    title,
    content,
    contentFootnote,
    hideContentFootnote,
    profile,
    children,
    layer,
}) => (
    <div
        className={classnames(
            className,
            styles.block,
            {
                [styles[`block-layer-${layer}`]]: layer > 0,
            },
        )}
    >
        <Block padding="xs l">
            {!!title && (
                <Block
                    className={styles['block-title']}
                    padding="xs xs 0"
                >
                    <Text
                        text={title}
                        size="xxs"
                        color="label"
                    />
                </Block>
            )}
            {!!(profile && content) && (
                <Block
                    className={styles['block-content']}
                    padding="xs"
                >
                    <ListItem
                        profile={profile}
                        content={(!!content && (
                            <Text
                                text={content}
                                color="default"
                            />
                        )) || null}
                        footnote={(!!contentFootnote && (
                            <div
                                className={classnames(
                                    styles['content-footnote'],
                                    {
                                        [styles.hide]: hideContentFootnote,
                                    },
                                )}
                            >
                                {contentFootnote}
                            </div>
                        )) || null}
                        size="s"
                        textSize="m"
                    />
                </Block>
            )}
        </Block>
        {children}
    </div>
);

EntityBlock.propTypes = {
    className: PropTypes.string,
    title: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]),
    content: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]),
    contentFootnote: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]),
    hideContentFootnote: PropTypes.bool,
    profile: profileShape,
    children: PropTypes.node,
    layer: PropTypes.number,
};

EntityBlock.defaultProps = {
    className: '',
    title: '',
    content: null,
    contentFootnote: null,
    hideContentFootnote: false,
    profile: null,
    children: null,
    layer: 0,
};

export default EntityBlock;
