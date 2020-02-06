import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
    SVG,
} from '@aztec/guacamole-ui';
import {
    animatedBlockType,
    profileShape,
} from '~/ui/config/propTypes';
import {
    iconSizeMap,
} from '~/ui/styles/guacamole-vars';
import AztecSvg from '~/ui/components/AztecSvg';
import linkGlyph from '~/ui/images/link.svg';
import EntityBlock from './EntityBlock';
import styles from './blocks.scss';

class AnimatedBlocks extends PureComponent {
    static getDerivedStateFromProps(nextProps, prevState) {
        const {
            type,
        } = nextProps;
        const {
            prevType,
        } = prevState;

        if (type === prevType) {
            return null;
        }

        return {
            transition: `to-${type}`,
        };
    }

    constructor(props) {
        super(props);

        const {
            type,
        } = props;

        this.state = {
            prevType: type,
            transition: '',
        };
    }

    componentDidMount() {
        this.continueTransition();
    }

    componentDidUpdate() {
        this.continueTransition();
    }

    continueTransition() {
        const {
            transition,
        } = this.state;
        if (transition) {
            const {
                type,
            } = this.props;
            setTimeout(() => {
                this.setState({
                    prevType: type,
                    transition: '',
                });
            }, 500);
        }
    }

    render() {
        const {
            type,
            blocks,
            sealedIcon,
        } = this.props;
        const {
            prevType,
            transition,
        } = this.state;

        return (
            <div
                className={classnames(
                    styles.wrapper,
                    styles[`type-${prevType}`],
                    {
                        [styles[`from-${prevType}`]]: transition,
                        [styles[transition]]: transition,
                    },
                )}
            >
                {blocks.map((block, i) => (
                    <div
                        key={+i}
                        className={classnames(
                            styles['block-wrapper'],
                            {
                                [styles['head-wrap']]: i === 0,
                                [styles['child-wrap']]: i > 0,
                            },
                        )}
                    >
                        <EntityBlock
                            layer={0}
                            {...block}
                        />
                        {!!sealedIcon && type === 'sealed' && i === 0 && (
                            <div className={styles['sealed-icon']}>
                                {sealedIcon === 'aztec' && (
                                    <AztecSvg
                                        theme="light"
                                        size="s"
                                    />
                                )}
                                {sealedIcon === 'link' && (
                                    <SVG
                                        glyph={linkGlyph}
                                        color="white"
                                        width={iconSizeMap.m}
                                        height={iconSizeMap.m}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }
}

AnimatedBlocks.propTypes = {
    type: PropTypes.oneOf(animatedBlockType),
    blocks: PropTypes.arrayOf(PropTypes.shape({
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
        extraContent: PropTypes.node,
    })).isRequired,
    sealedIcon: PropTypes.string,
};

AnimatedBlocks.defaultProps = {
    type: '',
    sealedIcon: '',
};

export default AnimatedBlocks;
