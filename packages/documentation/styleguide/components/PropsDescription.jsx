import React from 'react';
import PropTypes from 'prop-types';
import { Offset } from '@aztec/guacamole-ui';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import Markdown from 'react-styleguidist/lib/client/rsg-components/Markdown';
import {
    spacingMap,
    fontSizeMap,
    lineHeightMap,
    fontWeightMap,
    defaultLabelColor,
    colorMap,
} from '../../src/styles/guacamole-vars';
import { codeFontFamily, codeFontSizeMap } from '../../src/styles/variables';

const styles = () => ({
    description: {
        '& p, ul': {
            padding: [[spacingMap.xs, 0]],
            fontSize: fontSizeMap.xs,
            lineHeight: lineHeightMap.xs,
            fontWeight: fontWeightMap.light,
            color: defaultLabelColor,
        },
        '& ul': {
            marginLeft: spacingMap.xl,
        },
        '& li': {
            fontSize: 'inherit',
            lineHeight: 'inherit',
            color: 'inherit',
            listStyleType: 'disc outside',
        },
        '& p, ul, div': {
            // override the styles in ParaRenderer
            '& em': {
                fontFamily: codeFontFamily,
                fontSize: `${codeFontSizeMap.xs} !important`,
                padding: spacingMap.xs,
                borderRadius: spacingMap.xxs,
                backgroundImage: `linear-gradient(to bottom, transparent 0, ${colorMap['primary-lightest']} 0)`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '100%',
                backgroundPosition: '0 center',
            },
            '& code': {
                fontFamily: codeFontFamily,
                fontSize: `${codeFontSizeMap.xs} !important`,
            },
        },
    },
});

const PropsDescription = ({ classes, description }) => (
    <Offset top="s">
        <div className={classes.description}>
            <Markdown text={description} />
        </div>
    </Offset>
);

PropsDescription.propTypes = {
    classes: PropTypes.object.isRequired,
    description: PropTypes.string.isRequired,
};

export default Styled(styles)(PropsDescription);
