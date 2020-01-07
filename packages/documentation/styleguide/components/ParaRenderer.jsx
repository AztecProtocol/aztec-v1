import React from 'react';
import PropTypes from 'prop-types';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import prismTheme from 'react-styleguidist/lib/client/styles/prismTheme';
import {
  fontWeightMap,
  fontSizeMap,
  lineHeightMap,
} from '../../src/config/typography';

export const styles = ({
  space,
  color,
  fontFamily,
  fontSize,
  borderRadius,
}) => ({
  para: {
    color: color.base,
    fontFamily: fontFamily.base,
    fontWeight: fontWeightMap.light,
    fontSize: fontSizeMap.s,
    lineHeight: lineHeightMap.m,
    marginTop: space[1],
    marginBottom: space[1],
    '& > strong': {
      display: 'block',
      marginTop: space[2] * 2,
      fontWeight: fontWeightMap.bold,
    },
    '& + pre': {
      fontFamily: fontFamily.monospace,
      fontSize: fontSize.small,
      lineHeight: 1.5,
      color: color.base,
      whiteSpace: 'pre-wrap',
      wordWrap: 'normal',
      tabSize: 2,
      hyphens: 'none',
      backgroundColor: color.codeBackground,
      padding: [[space[1], space[2]]],
      border: [[1, color.codeBackground, 'solid']],
      borderRadius,
      marginTop: space[2] * 2,
      marginBottom: space[2] * 2,
      ...prismTheme({
        color,
      }),
    },
    '& > span': {
      display: 'block',
      marginTop: `-${space[1]}px`,
      marginBottom: `-${space[1]}px`,
      fontSize: '12px',
      lineHeight: '12px',
    },
  },
});

export function ParaRenderer({
  classes,
  semantic,
  children,
}) {
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
