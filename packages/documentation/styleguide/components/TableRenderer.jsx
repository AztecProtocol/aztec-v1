import React from 'react';
import PropTypes from 'prop-types';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import {
  spacingMap,
} from '../../src/styles/guacamole-vars';

export const styles = ({
  space, color, fontFamily, fontSize,
}) => ({
  tableWrapper: {
    padding: [[spacingMap.xl, 0]],
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHead: {
    borderBottom: [[1, color.border, 'solid']],
    fontWeight: 300,
  },
  cellHeading: {
    color: color.base,
    paddingRight: space[2],
    paddingBottom: space[1],
    textAlign: 'left',
    fontFamily: fontFamily.base,
    fontWeight: '300',
    fontSize: fontSize.small,
    whiteSpace: 'nowrap',
  },
  cell: {
    color: color.base,
    paddingRight: spacingMap.l,
    paddingTop: spacingMap.m,
    paddingBottom: spacingMap.m,
    verticalAlign: 'top',
    fontFamily: fontFamily.base,
    fontSize: fontSize.small,
    '&:last-child': {
      isolate: false,
      width: '99%',
      paddingRight: 0,
    },
    '& p:last-child': {
      isolate: false,
      marginBottom: 0,
    },
  },
});

export function TableRenderer({
  classes,
  columns,
  rows,
  getRowKey,
}) {
  return (
    <div className={classes.tableWrapper}>
      <table className={classes.table}>
        <thead className={classes.tableHead}>
          <tr>
            {columns.map(({ caption }) => (
              <th key={caption} className={classes.cellHeading}>
                {caption}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={getRowKey(row)}>
              {columns.map(({ render }, index) => (
                <td key={+index} className={classes.cell}>
                  {render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

TableRenderer.propTypes = {
  classes: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      caption: PropTypes.string.isRequired,
      render: PropTypes.func.isRequired,
    })
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  getRowKey: PropTypes.func.isRequired,
};

export default Styled(styles)(TableRenderer);
