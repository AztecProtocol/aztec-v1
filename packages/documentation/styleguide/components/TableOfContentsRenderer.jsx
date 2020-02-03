import React from 'react';
import PropTypes from 'prop-types';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import Logo from './Logo';
import AZTECLogo from '../../images/logo.png';
import {
  spacingMap,
  colorMap,
  defaultLabelColor,
} from '../../src/styles/guacamole-vars';

const styles = ({
  space,
  color,
  fontFamily,
  fontSize,
}) => ({
  root: {
    fontFamily: fontFamily.base,
  },
  search: {
    padding: space[2],
  },
  input: {
    display: 'block',
    width: '100%',
    paddingLeft: space[2],
    paddingRight: space[2],
    paddingTop: space[1],
    paddingBottom: space[1],
    color: '#fff',
    backgroundColor: 'rgba(255,255,255, 0.4)',
    fontFamily: fontFamily.base,
    fontSize: fontSize.base,
    border: [[1, colorMap['white-lightest'], 'solid']],
    borderRadius: '20px',
    transition: 'all ease-in-out .1s',
    '&:focus': {
      isolate: false,
      backgroundColor: 'rgba(255,255,255, 0.8)',
      outline: 0,
      color: color.base,
      '&::placeholder': {
        fontWeight: 200,
        color: defaultLabelColor,
      },
    },
    '&::placeholder': {
      isolate: false,
      fontFamily: fontFamily.base,
      fontWeight: 200,
      fontSize: fontSize.base,
      color: colorMap.white,
    },
  },
  content: {
    margin: [[0, `-${spacingMap.s}`]],
  },
});

export function TableOfContentsRenderer({
  classes, children, searchTerm, onSearchTermChange,
}) {
  return (
    <div>
      <div className={classes.root}>
        <nav>
          <Logo>
            <img
              width="100%"
              alt="AZTEC"
              src={AZTECLogo}
            />
          </Logo>
          <div className={classes.search}>
            <input
              value={searchTerm}
              className={classes.input}
              placeholder="Filter by name"
              aria-label="Filter by name"
              onChange={event => onSearchTermChange(event.target.value)}
            />
          </div>
          <div className={classes.content}>
            {children}
          </div>
        </nav>
      </div>
    </div>
  );
}

TableOfContentsRenderer.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.node,
  searchTerm: PropTypes.string.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
};

TableOfContentsRenderer.defaultProps = {
  children: null,
};

export default Styled(styles)(TableOfContentsRenderer);
