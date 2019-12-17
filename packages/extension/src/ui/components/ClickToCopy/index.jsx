import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import {
    Clickable,
} from '@aztec/guacamole-ui';
import Hint from '~/ui/components/Hint';
import i18n from '~/ui/helpers/i18n';
import styles from './copy.scss';

class ClickToCopy extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            copied: false,
        };
    }

    copy = () => {
        const {
            text,
        } = this.props;

        copyToClipboard(text);
        this.setState({
            copied: true,
        });
    };

    clearCopiedState = () => {
        const {
            copied,
        } = this.state;
        if (!copied) return;

        this.setState({
            copied: false,
        });
    };

    render() {
        const {
            className,
            children,
        } = this.props;
        const {
            copied,
        } = this.state;

        return (
            <Clickable
                className={className}
                onClick={this.copy}
            >
                <div
                    className={styles.copy}
                    onMouseLeave={this.clearCopiedState}
                >
                    <Hint
                        className={styles.hint}
                        text={i18n.t(copied ? 'copied' : 'click.to.copy')}
                    />
                    {children}
                </div>
            </Clickable>
        );
    }
}

ClickToCopy.propTypes = {
    className: PropTypes.string,
    text: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

ClickToCopy.defaultProps = {
    className: '',
};

export default ClickToCopy;
