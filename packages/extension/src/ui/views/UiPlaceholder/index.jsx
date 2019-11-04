import React, {
    useContext,
} from 'react';
import PropTypes from 'prop-types';
import ThemeContext from '~ui/views/handlers/ThemeContext';
import Loading from '~/ui/views/Loading';
import Popup from '~/ui/components/Popup';
import PoweredBy from '~/ui/components/PoweredBy';
import styles from './placeholder.scss';

const UiPlaceholder = ({
    children,
}) => {
    const theme = useContext(ThemeContext);

    return (
        <div id="aztec-popup">
            <div id="aztec-popup-ui">
                {children}
            </div>
            <div id="aztec-popup-placeholder">
                <Popup>
                    <Loading />
                </Popup>
            </div>
            <PoweredBy
                className={styles.footer}
                theme={theme.name}
            />
        </div>
    );
};

UiPlaceholder.propTypes = {
    children: PropTypes.node,
};

UiPlaceholder.defaultProps = {
    children: null,
};

export default UiPlaceholder;
