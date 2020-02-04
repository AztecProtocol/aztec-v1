import React from 'react';
import PropTypes from 'prop-types';
import {
  Offset,
} from '@aztec/guacamole-ui';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import Markdown from 'react-styleguidist/lib/client/rsg-components/Markdown';
import {
  spacingMap,
  defaultFontFamily,
  fontSizeMap,
  lineHeightMap,
  fontWeightMap,
} from '../../src/styles/guacamole-vars';

const styles = ({
  color,
}) => ({
  description: {
    '& p, ul': {
      padding: [[spacingMap.xs, 0]],
      fontFamily: defaultFontFamily,
      fontSize: fontSizeMap.xs,
      lineHeight: lineHeightMap.xs,
      fontWeight: fontWeightMap.light,
      color: color.light,
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
  },
});

const PropsDescription = ({
  classes,
  description,
}) => (
  <Offset
    margin="s 0"
  >
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
