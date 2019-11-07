import React, {
    useState,
} from 'react';
import PropTypes from 'prop-types';
import posed, { PoseGroup } from 'react-pose';
import ThemeContext from '~ui/views/handlers/ThemeContext';
import Loading from '~/ui/views/Loading';
import Popup from '~/ui/components/Popup';
import PoweredBy from '~/ui/components/PoweredBy';
import styles from './placeholder.scss';

const Overlay = posed.div({
    enter: {
        opacity: 1,
        delay: 300,
    },
    exit: {
        opacity: 0,
        transition: { duration: 400 },
    },
});

const UiPlaceholder = ({ children }) => {
    const [visible, toggle] = useState(false);
    const [renderOverlay, updateOverlay] = useState(false);
    const [setListener, updateSetListener] = useState(false);
    const [renderPopup, updatePopup] = useState(false);

    if (!setListener) {
        window.addEventListener('openAztec', () => {
            toggle(true);
            setTimeout(() => updateOverlay(true));
            setTimeout(() => updatePopup(true), 400);
        });
        window.addEventListener('closeAztec', () => {
            toggle(false);
            updateOverlay(false);
            updatePopup(false);
        });
        updateSetListener(true);
    }


    return (
        <div id="aztec-popup-container">
            <PoseGroup>
                {renderOverlay && visible && (
                    <Overlay className="aztec-overlay" key="overlay" />
                )}

            </PoseGroup>
            <div className={renderPopup && visible ? 'aztec-popup shown' : 'aztec-popup'} key="content">
                <div id="aztec-popup-ui">
                    {children}
                </div>
                <div id="aztec-popup-placeholder">
                    <Popup>
                        <Loading />
                    </Popup>
                </div>
                <ThemeContext.Consumer>
                    {theme => (
                        <PoweredBy
                            className={styles.footer}
                            theme={theme.name}
                        />
                    )}
                </ThemeContext.Consumer>
            </div>


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
