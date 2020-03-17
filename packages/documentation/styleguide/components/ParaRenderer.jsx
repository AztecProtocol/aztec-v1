import React from 'react';
import PropTypes from 'prop-types';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import prismTheme from 'react-styleguidist/lib/client/styles/prismTheme';
import {
    defaultTextColor,
    spacingMap,
    fontWeightMap,
    fontSizeMap,
    lineHeightMap,
    roundedCornerMap,
} from '../../src/styles/guacamole-vars';
import { codeFontFamily, codeFontSizeMap, codeBackground } from '../../src/styles/variables';

export const styles = ({ color }) => ({
    para: {
        color: defaultTextColor,
        fontWeight: fontWeightMap.light,
        fontSize: fontSizeMap.s,
        lineHeight: lineHeightMap.s,
        marginTop: 0,
        marginBottom: 0,
        padding: [[spacingMap.xs, 0]],
        '& + pre': {
            marginTop: spacingMap.xl,
            marginBottom: spacingMap.xl,
            padding: [[spacingMap.s, spacingMap.l]],
            backgroundColor: codeBackground,
            borderRadius: roundedCornerMap.xs,
            border: 'none',
            fontFamily: codeFontFamily,
            fontSize: `${codeFontSizeMap.xs} !important`,
            lineHeight: 1.5,
            color: 'inherit',
            whiteSpace: 'pre-wrap',
            wordWrap: 'normal',
            tabSize: 2,
            hyphens: 'none',
            ...prismTheme({
                color,
            }),
        },
        '& > span': {
            display: 'block',
            marginTop: spacingMap.xs,
            marginBottom: spacingMap.xs,
            fontSize: fontSizeMap.xxs,
            lineHeight: fontSizeMap.xxs,
        },
    },
});

export function ParaRenderer({ classes, semantic, children }) {
    const Tag = semantic || 'div';

    return <Tag className={classes.para}>{children}</Tag>;
}

ParaRenderer.propTypes = {
    classes: PropTypes.object.isRequired,
    semantic: PropTypes.oneOf(['', 'p']),
    children: PropTypes.node.isRequired,
};

ParaRenderer.defaultProps = {
    semantic: '',
};

export default Styled(styles)(ParaRenderer);
