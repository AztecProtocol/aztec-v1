import React from 'react';
import PropTypes from 'prop-types';
import {
    Offset,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';
import {
    errorShape,
} from '~/ui/config/propTypes';
import ProgressStatus from './ProgressStatus';
import styles from './progress.scss';

const ProgressList = ({
    className,
    steps,
    currentStep,
    loading,
    error,
}) => {
    const stepNodes = steps.map(({
        title,
        titleKey,
    }, i) => {
        let status;
        if (i < currentStep) {
            status = 'done';
        } else if (i > currentStep) {
            status = 'pending';
        } else if (error) {
            status = 'error';
        } else {
            status = loading ? 'loading' : 'pending';
        }
        return (
            <Block
                key={`step-${+i}`}
                className={styles['list-item']}
                padding="xs 0"
            >
                <div className="flex-free-expand">
                    <Text
                        text={title || i18n.t(titleKey)}
                        size="xs"
                        color={status === 'pending' && currentStep >= 0 ? 'label' : 'default'}
                    />
                </div>
                <Block
                    className="flex-fixed"
                    top="xxs"
                >
                    <ProgressStatus
                        status={status}
                    />
                </Block>
            </Block>
        );
    });

    return (
        <Offset
            className={className}
            margin="xs 0"
        >
            {stepNodes}
        </Offset>
    );
};

ProgressList.propTypes = {
    className: PropTypes.string,
    steps: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string,
        titleKey: PropTypes.string,
    })).isRequired,
    currentStep: PropTypes.number.isRequired,
    error: errorShape,
    loading: PropTypes.bool,
};

ProgressList.defaultProps = {
    className: '',
    error: null,
    loading: false,
};

export default ProgressList;
