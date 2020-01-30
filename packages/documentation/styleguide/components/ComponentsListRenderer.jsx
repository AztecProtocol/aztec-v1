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

const styles = ({
  color, space,
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
        heading,
        href,
        visibleName,
        content,
        hasParent,
        external,
      }) => {
        const isChild = !content || !content.props.items.length;
        const isItemSelected = `/#/${windowHash}` === href;
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

            {isOpen[visibleName] && content}
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
