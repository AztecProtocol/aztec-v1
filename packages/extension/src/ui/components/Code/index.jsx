import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './code.scss';

const generateNodes = (str) => {
    const codeNodes = [];
    str.split('\n').forEach((line, i) => {
        const [,
            whitespaces,
            attr,
            colon,
            val,
            comma,
        ] = line.match(/^(\s+'?)([a-z-]+)('?:\s+)(.+)(,\s{0,})$/i) || [];
        if (!attr) {
            codeNodes.push(`${line}\n`);
        } else {
            codeNodes.push(
                whitespaces,
                (
                    <span
                        key={`attr-${+i}`}
                        className={styles.attr}
                    >
                        {attr}
                    </span>
                ),
                colon,
            );

            const isStr = val.match(/^'.+'$/);
            codeNodes.push((
                <span
                    key={`val-${+i}`}
                    className={styles[isStr ? 'str' : 'val']}
                >
                    {val}
                </span>
            ));
            codeNodes.push(`${comma}\n`);
        }
    });

    return codeNodes;
};

const Code = ({
    className,
    language,
    children,
}) => (
    <pre
        className={classnames(
            className,
            styles.code,
        )}
    >
        <code
            className={language}
        >
            {generateNodes(children)}
        </code>
    </pre>
);

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
