import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import returnAndClose from '~uiModules/helpers/returnAndClose';
import Loading from '~ui/views/Loading';

class CombinedViews extends PureComponent {
    constructor(props) {
        super(props);

        const {
            initialStep,
            initialData,
            fetchInitialData,
        } = props;

        this.state = {
            step: initialStep,
            data: initialData,
            history: [initialData],
            loading: !!fetchInitialData,
        };
    }

    componentDidMount() {
        this.fetchInitialData();
    }

    handleGoBack = (childState = {}) => {
        const {
            onGoBack,
        } = this.props;
        const {
            step,
            data: prevData,
            history,
        } = this.state;

        let stepOffset = 1;
        let modifiedData;
        if (onGoBack) {
            ({
                stepOffset = 1,
                ...modifiedData
            } = onGoBack(step, {
                ...prevData,
                ...childState,
            }));
        }

        const backToStep = step - stepOffset;
        const historyData = history[backToStep];

        this.goToStep({
            step: backToStep,
            data: {
                ...historyData,
                ...childState,
                ...modifiedData,
            },
            history: history.slice(0, backToStep),
        });
    };

    handleGoNext = (childState = {}) => {
        const {
            Steps,
            onGoNext,
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
            const {
                onExit,
                autoClose,
                closeDelay,
            } = this.props;

            if (onExit) {
                onExit(data);
            } else if (autoClose) {
                returnAndClose(data, closeDelay);
            }
            return;
        }

        let stepOffset = 1;
        if (onGoNext) {
            let newProps = null;
            ({
                stepOffset = 1,
                ...newProps
            } = onGoNext(step, data));
            data = {
                ...data,
                ...newProps,
            };
        }

        const nextStep = step + stepOffset;
        const {
            history: prevHistory,
        } = this.state;
        const history = [...prevHistory];
        history[nextStep] = data;

        this.goToStep({
            step: nextStep,
            data,
            history,
        });
    };

    goToStep(state) {
        const {
            onStep,
        } = this.props;
        const {
            step,
            data,
        } = state;
        let newData = data;
        if (onStep) {
            const newProps = onStep(step);
            newData = {
                ...newData,
                ...newProps,
            };
        }

        this.setState({
            ...state,
            data: newData,
        });
    }

    async fetchInitialData() {
        const {
            fetchInitialData,
            initialData,
        } = this.props;
        if (!fetchInitialData) return;

        const data = await fetchInitialData();
        this.setState({
            data: {
                ...initialData,
                ...data,
            },
            loading: false,
        });
    }

    render() {
        const {
            Steps,
        } = this.props;
        const {
            step,
            data,
            loading,
        } = this.state;

        if (loading) {
            return <Loading />;
        }

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
    fetchInitialData: PropTypes.func,
    onGoBack: PropTypes.func,
    onStep: PropTypes.func,
    onGoNext: PropTypes.func,
    onExit: PropTypes.func,
    autoClose: PropTypes.bool,
    closeDelay: PropTypes.number,
};

CombinedViews.defaultProps = {
    initialStep: 0,
    initialData: {},
    fetchInitialData: null,
    onGoBack: null,
    onStep: null,
    onGoNext: null,
    onExit: null,
    autoClose: false,
    closeDelay: 1500,
};

export default CombinedViews;
