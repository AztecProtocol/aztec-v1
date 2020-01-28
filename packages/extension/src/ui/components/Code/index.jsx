import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import highlight from 'highlight.js';
import './code.scss';

class Code extends PureComponent {
    componentDidMount() {
        const snippet = ReactDOM.findDOMNode(this.snippet); // eslint-disable-line react/no-find-dom-node
        highlight.highlightBlock(snippet);
    }

    setSnippetRef = (ref) => {
        this.snippet = ref;
    };

    render() {
        const {
            className,
            language,
            children,
        } = this.props;

        return (
            <pre className={className}>
                <code
                    className={language}
                    ref={this.setSnippetRef}
                >
                    {children}
                </code>
            </pre>
        );
    }
}

Code.propTypes = {
    className: PropTypes.string,
    language: PropTypes.oneOf([
        'javascript',
    ]),
    children: PropTypes.string.isRequired,
};

Code.defaultProps = {
    className: '',
    language: 'javascript',
};

export default Code;
