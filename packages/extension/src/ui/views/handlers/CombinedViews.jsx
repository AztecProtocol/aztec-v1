import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';

class CombinedViews extends PureComponent {
    constructor(props) {
        super(props);

        const {
            initialStep,
            initialData,
        } = props;

        this.state = {
            step: initialStep,
            data: initialData,
        };
    }

    handleGoBack = () => {
        const {
            onGoBack,
        } = this.props;
        const {
            step,
            data: prevData,
        } = this.state;
        let data = prevData;
        let stepOffset = 1;
        if (onGoBack) {
            ({
                stepOffset = 1,
                ...data
            } = onGoBack(step, prevData));
        }

        this.setState({
            step: step - stepOffset,
            data,
        });
    };

    handleGoNext = (childState = {}) => {
        const {
            onGoNext,
            onExit,
            Steps,
        } = this.props;
        const {
            step,
            data: prevData,
        } = this.state;
        let data = {
            ...prevData,
            ...childState,
        };

        if (step === Steps.length - 1) {
            onExit(data);
            return;
        }

        let stepOffset = 1;
        if (onGoNext) {
            ({
                stepOffset = 1,
                ...data
            } = onGoNext(step, data));
        }

        this.setState({
            step: step + stepOffset,
            data,
        });
    };

    render() {
        const {
            Steps,
        } = this.props;
        const {
            step,
            data,
        } = this.state;
        const Step = Steps[step];

        if (!Step) {
            return null;
        }

        return (
            <Step
                {...data}
                goBack={step > 0 ? this.handleGoBack : null}
                goNext={this.handleGoNext}
            />
        );
    }
}

CombinedViews.propTypes = {
    initialStep: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    Steps: PropTypes.arrayOf(PropTypes.func).isRequired,
    onGoBack: PropTypes.func,
    onGoNext: PropTypes.func,
    onExit: PropTypes.func.isRequired,
};

CombinedViews.defaultProps = {
    initialStep: 0,
    initialData: {},
    onGoBack: null,
    onGoNext: null,
};

export default CombinedViews;
