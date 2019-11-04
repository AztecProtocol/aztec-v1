import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import posed, { PoseGroup } from 'react-pose';
import returnAndClose from '~uiModules/helpers/returnAndClose';
import Loading from '~ui/views/Loading';

const StepContent = posed.div({
    enter: {
        x: 0,
        opacity: 1,
        transition: {
            x: { type: 'spring', stiffness: 100, damping: 50 },
            default: { duration: 330 },
        },
    },
    left: {
        x: '-50%',
        opacity: 0,
        transition: {
            x: { type: 'spring', stiffness: 100, damping: 50 },
            default: { duration: 330 },
        },
    },
    right: {
        x: '50%',
        opacity: 0,
        transition: {
            x: { type: 'spring', stiffness: 100, damping: 50 },
            default: { duration: 330 },
        },
    },
});

class CombinedViews extends PureComponent {
    static getDerivedStateFromProps(nextProps, prevState) {
        const {
            prevProps: {
                retry: prevRetry,
            },
        } = prevState;
        const {
            retry,
        } = nextProps;
        if (retry === prevRetry) {
            return null;
        }

        const {
            initialStep,
            initialData,
            fetchInitialData,
            onStep,
        } = nextProps;
        const {
            history,
        } = prevState;

        const requireInitialFetch = !history && !!fetchInitialData;

        const data = history
            ? history[initialStep]
            : initialData;

        let extraData;
        if (onStep && !requireInitialFetch) {
            extraData = onStep(initialStep, data);
        }

        return {
            step: initialStep,
            data: {
                ...data,
                ...extraData,
            },
            history: !history
                ? [data]
                : history.slice(0, initialStep + 1),
            loading: requireInitialFetch,
            prevProps: {
                retry,
            },
        };
    }

    constructor(props) {
        super(props);

        this.state = {
            step: -1,
            data: null,
            history: null,
            loading: false,
            direction: 1,
            prevProps: {
                retry: -1,
            },
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
            direction: -1,
            data: {
                ...historyData,
                ...childState,
                ...modifiedData,
            },
            history: history.slice(0, backToStep + 1),
        });
    };

    handleGoNext = (childState = {}) => {
        const {
            Steps,
            onGoNext,
        } = this.props;
        const {
            step,
            history: prevHistory,
        } = this.state;
        const prevData = prevHistory[step];
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
        const history = [...prevHistory];
        history[nextStep] = data;

        this.goToStep({
            step: nextStep,
            direction: 1,
            data,
            history,
        });
    };

    goToStep(state) {
        const {
            step,
            data,
        } = state;
        const {
            redirect,
        } = data;
        if (redirect) return;

        let newData = data;
        const {
            onStep,
        } = this.props;
        if (onStep) {
            const newProps = onStep(step, data);
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

        const newData = await fetchInitialData();
        const data = {
            ...initialData,
            ...newData,
        };
        this.goToStep({
            step: 0,
            data,
            history: [data],
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
            direction,
        } = this.state;

        if (loading) {
            return <Loading />;
        }

        const Step = Steps[step];

        if (!Step) {
            return null;
        }

        return (
            <PoseGroup 
                preEnterPose={direction > 0 ? 'right' : 'left'}
                exitPose={direction > 0 ? 'left' : 'right'}
            >
                <StepContent key={step}>
                    <Step
                        {...data}
                        goBack={step > 0 ? this.handleGoBack : null}
                        goNext={this.handleGoNext}
                    />
                </StepContent>
            </PoseGroup>
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
    retry: PropTypes.number,
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
    retry: 0,
};

export default CombinedViews;
