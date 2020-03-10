import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import {
  spacingMap,
  defaultTextColor,
  fontSizeMap,
  lineHeightMap,
  fontWeightMap,
} from '../../src/styles/guacamole-vars';

const styles = () => ({
  heading: {
    color: defaultTextColor,
  },
  heading1: {
    padding: `${spacingMap.xl} 0`,
    fontSize: fontSizeMap.xl,
    lineHeight: lineHeightMap.xl,
    fontWeight: fontWeightMap.light,
  },
  heading2: {
    padding: `${spacingMap.l} 0`,
    fontSize: fontSizeMap.l,
    lineHeight: lineHeightMap.l,
    fontWeight: fontWeightMap.light,
  },
  heading3: {
    padding: `${spacingMap.l} 0`,
    fontSize: fontSizeMap.m,
    lineHeight: lineHeightMap.m,
    fontWeight: fontWeightMap.light,
  },
  heading4: {
    padding: `${spacingMap.m} 0`,
    fontSize: fontSizeMap.s,
    lineHeight: lineHeightMap.s,
  },
  heading5: {
    padding: `${spacingMap.s} 0`,
    fontSize: fontSizeMap.xs,
    lineHeight: lineHeightMap.xs,
  },
  heading6: {
    padding: `${spacingMap.s} 0`,
    fontSize: fontSizeMap.xxs,
    lineHeight: lineHeightMap.xxs,
  },
});

function HeadingRenderer({
  classes,
  level,
  children,
  ...props
}) {
  const Tag = `h${level}`;
  const headingClasses = classnames(
    classes.heading,
    classes[`heading${level}`],
  );

  return (
    <Tag
      {...props}
      className={headingClasses}
    >
      {children}
    </Tag>
  );
}

HeadingRenderer.propTypes = {
  classes: PropTypes.object.isRequired,
  level: PropTypes.oneOf([1, 2, 3, 4, 5, 6]).isRequired,
  children: PropTypes.node,
};

HeadingRenderer.defaultProps = {
  children: null,
};

export default Styled(styles)(HeadingRenderer);
