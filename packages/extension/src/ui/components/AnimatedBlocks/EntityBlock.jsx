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
    profile,
    extraContent,
    children,
    layer,
    hideTitile,
    hideContentFootnote,
    hideExtra,
}) => (
    <div
        className={classnames(
            className,
            styles.block,
            {
                [styles[`block-layer-${layer}`]]: layer > 0,
                [styles['fx-hide-title']]: hideTitile,
                [styles['fx-hide-content-footnote']]: hideContentFootnote,
                [styles['fx-hide-extra']]: hideExtra,
            },
        )}
    >
        {!!(title || profile || content) && (
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
                {!!(profile || content) && (
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
                                    className={styles['content-footnote']}
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
        )}
        {!!extraContent && (
            <div className={styles['block-extra']}>
                <Block padding="0 l">
                    {extraContent}
                </Block>
            </div>
        )}
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
    profile: profileShape,
    extraContent: PropTypes.node,
    children: PropTypes.node,
    layer: PropTypes.number,
    hideTitile: PropTypes.bool,
    hideContentFootnote: PropTypes.bool,
    hideExtra: PropTypes.bool,
};

EntityBlock.defaultProps = {
    className: '',
    title: '',
    content: null,
    contentFootnote: null,
    profile: null,
    extraContent: null,
    children: null,
    layer: 1,
    hideContentFootnote: false,
    hideTitile: false,
    hideExtra: false,
};

export default EntityBlock;
