import React, {
  useState,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import Link from 'react-styleguidist/lib/client/rsg-components/Link';
import {
  getHash,
} from 'react-styleguidist/lib/client/utils/handleHash';
import {
  spacingMap,
} from '../../src/config/layout';
import {
  STATIC_SECTION_BUTTONS,
} from '../constants/styles';

const styles = ({
  space,
}) => ({
  root: {
    padding: [[spacingMap.m, spacingMap.l]],
    fontWeight: 400,
    fontSize: 16,
    color: 'white !important',
  },
  item: {
    padding: [[space[1], 0]],
    fontWeight: 400,
    fontSize: 16,
    color: 'white !important',
  },
  link: {
    color: 'white !important',
  },
  staticButton: {
    cursor: 'default',
  },
  a: {
    color: 'white !important',
  },
  heading: {
    height: '100%',
  },
  selected: {
    fontWeight: 500,
    color: 'white !important',
  },
  child: {
    fontWeight: 300,
    fontSize: 14,
    color: 'white !important',
  },
});

export const ComponentsListRenderer = ({
  classes,
  items,
}) => {
  const visibleItems = items.filter(item => item.visibleName);

  const [isOpen, toggleOpen] = useState({});

  if (!visibleItems.length) {
    return null;
  }

  const windowHash = getHash(window.location.hash);
  return (
    <div
      className={classes.root}
    >
      {visibleItems.map(({
        name,
        heading,
        href,
        visibleName,
        content,
        external,
      }) => {
        const isChild = !content || !content.props.items.length;
        const isItemSelected = `/#/${windowHash}` === href;
        // hard-coded static button names for now
        // as there's no way to use existing properties to define a button as "static" through styleguide.config
        const isStatic = STATIC_SECTION_BUTTONS.indexOf(name) >= 0;
        const linkNode = isStatic
          ? (
            <div
              className={classnames(classes.staticButton, {
                [classes.selected]: isItemSelected,
              })}
              onClick={() => heading && toggleOpen({
                ...isOpen,
                [visibleName]: !isOpen[visibleName],
              })}
            >
              {visibleName}
            </div>
          )
          : (
            <Link
              className={classnames({
                [classes.selected]: isItemSelected,
              })}
              href={href}
              target={external ? '_blank' : undefined}
              onClick={() => heading && toggleOpen({
                ...isOpen,
                [visibleName]: !isOpen[visibleName],
              })}
            >
              {visibleName}
            </Link>
          );

        return (
          <div
            key={href}
            className={classnames(
              classes.item,
              {
                [classes.heading]: heading,
                [classes.child]: isChild,
                [classes.selected]: isItemSelected,
              },
            )}
          >
            {linkNode}
            {(isOpen[visibleName] || isStatic) && content}
          </div>
        );
      })}
    </div>
  );
};

ComponentsListRenderer.propTypes = {
  classes: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired,
};

export default Styled(styles)(ComponentsListRenderer);
