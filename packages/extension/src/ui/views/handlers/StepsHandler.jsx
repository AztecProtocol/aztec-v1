import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    ProgressBar,
} from '@aztec/guacamole-ui';
import {
    errorLog,
} from '~/utils/log';
import {
    transactionStepShape,
} from '~/ui/config/propTypes';
import {
    closeWindowDelay,
} from '~/ui/config/settings';
import closeWindow from '~/ui/utils/closeWindow';
import ensureMinPendingTime from '~/ui/utils/ensureMinPendingTime';
import returnAndClose from '~uiModules/helpers/returnAndClose';
import Loading from '~/ui/views/Loading';

class StepsHandler extends PureComponent {
    constructor(props) {
        super(props);
        const {
            steps,
            retryWithMetaMaskStep,
            initialStep,
            initialTask,
            initialData,
            fetchInitialData,
        } = props;

        const history = [];
        if (initialData) {
            history[initialStep] = initialData;
        }

        this.state = {
            steps,
            retryWithMetaMaskStep,
            currentStep: initialStep,
            currentTask: initialTask,
            data: initialData,
            history,
            pendingInitialFetch: !!fetchInitialData,
            loading: false,
            error: null,
        };
    }

    componentDidMount() {
        this.fetchInitialData();
    }

    handleSubmit = async (childData) => {
        const {
            loading,
            data: prevData,
        } = this.state;
        if (loading) {
            return;
        }

        this.setState(
            {
                loading: true,
                data: {
                    ...prevData,
                    ...childData,
                },
            },
            this.validateSubmitData,
        );
    };

    handleGoBack = () => {
        const {
            onGoBack,
        } = this.props;
        const {
            currentStep,
            data: prevData,
            history,
        } = this.state;

        let stepOffset = 1;
        let modifiedData;
        if (onGoBack) {
            ({
                stepOffset = 1,
                ...modifiedData
            } = onGoBack(currentStep, prevData));

            if (modifiedData.redirect) return;
        }

        const backToStep = currentStep - stepOffset;
        const historyData = history[backToStep];

        this.goToStep(backToStep, {
            ...historyData,
            ...modifiedData,
        });
    };

    handleGoNext = async (accumData) => {
        const {
            onGoNext,
        } = this.props;
        const {
            steps,
            currentStep,
        } = this.state;
        const {
            onGoNext: stepOnGoNext,
        } = steps[currentStep];

        let stepOffset = 1;
        let data = accumData;
        let error;
        const shouldContinue = [stepOnGoNext, onGoNext]
            .filter(fn => fn)
            .every((fn) => {
                const {
                    stepOffset: offset,
                    error: stepError,
                    redirect,
                    ...modifiedData
                } = fn(data, currentStep) || {};

                if (stepError || redirect) {
                    error = stepError;
                    return false;
                }

                if (offset !== undefined) {
                    stepOffset = offset;
                }

                data = {
                    ...data,
                    ...modifiedData,
                };

                return true;
            });

        if (error) {
            this.handleError(error);
            return;
        }

        if (!shouldContinue) return;

        const nextStep = currentStep + stepOffset;

        this.goToStep(nextStep, accumData);
    };

    runTask = async (accumData = null) => {
        const {
            runTask,
        } = this.props;
        const {
            steps,
            currentStep,
            currentTask: prevTask,
            data: prevData,
        } = this.state;
        const {
            tasks = [],
        } = steps[currentStep] || {};
        const currentTask = prevTask + 1;
        const task = tasks[currentTask];
        let data = accumData || prevData;

        if (!task) {
            this.handleGoNext(data);
            return;
        }

        const {
            run,
        } = task;
        let response;
        try {
            if (run) {
                response = await run(data);
            } else if (runTask) {
                response = await runTask(task, data);
            }
        } catch (error) {
            errorLog(error);
            response = {
                error,
            };
        }

        const {
            error,
        } = response || {};
        if (error) {
            this.handleError(error);
            return;
        }

        data = {
            ...data,
            ...response,
        };

        if (currentTask === tasks.length - 1) {
            this.setState(
                {
                    currentTask,
                    data,
                },
                () => this.handleGoNext(data),
            );
            return;
        }

        this.setState(
            {
                currentTask,
                data,
            },
            ensureMinPendingTime(this.runTask, 300),
        );
    };

    handleRetryStep = () => {
        this.setState({
            currentTask: -1,
            error: null,
        });
    };

    handleRetryTask = () => {
        this.setState(
            {
                error: null,
                loading: true,
            },
            ensureMinPendingTime(this.runTask, 600),
        );
    };

    handleRetryWithMetaMask = () => {
        const {
            steps,
            retryWithMetaMaskStep,
            data,
        } = this.state;

        this.setState(
            {
                steps: !retryWithMetaMaskStep
                    ? steps
                    : steps.slice(0, -1).concat(retryWithMetaMaskStep),
                data: {
                    ...data,
                    isGSNAvailable: false,
                },
                currentTask: -1,
                error: null,
                loading: true,
            },
            ensureMinPendingTime(this.runTask, 600),
        );
    };

    handleError(error) {
        this.setState({
            loading: false,
            error: typeof error === 'string'
                ? { message: error }
                : error,
        });
    }

    async fetchInitialData() {
        const {
            fetchInitialData,
            initialData,
        } = this.props;
        if (!fetchInitialData) return;

        const {
            steps,
            retryWithMetaMaskStep,
            ...newData
        } = await fetchInitialData();

        const {
            steps: initialSteps,
            retryWithMetaMaskStep: initialRetryStep,
            currentStep,
            history: prevHistory,
        } = this.state;
        const data = {
            ...initialData,
            ...newData,
        };
        const history = [...prevHistory];
        history[currentStep] = data;

        this.setState({
            steps: steps || initialSteps,
            retryWithMetaMaskStep: retryWithMetaMaskStep || initialRetryStep,
            data,
            history,
            pendingInitialFetch: false,
        });
    }

    async validateSubmitData() {
        const {
            onSubmit,
        } = this.props;
        const {
            data: prevData,
        } = this.state;

        let data = prevData;
        if (onSubmit) {
            const {
                error,
                ...extraData
            } = await onSubmit(data) || {};
            if (error) {
                this.handleError(error);
                return;
            }
            data = {
                ...data,
                ...extraData,
            };
        }

        this.runTask(data);
    }

    handleClose(accumData) {
        const {
            onExit,
            closeDelay,
        } = this.props;
        if (onExit) {
            onExit(accumData);
        } else {
            returnAndClose(accumData, closeDelay);
        }
    }

    goToStep(step, accumData) {
        const {
            steps,
            history: prevHistory,
        } = this.state;
        const {
            onGoStep,
        } = this.props;

        if (step < 0) {
            closeWindow(0, true);
            return;
        }
        if (step === steps.length) {
            this.handleClose(accumData);
            return;
        }

        let data = accumData;
        if (onGoStep) {
            const newProps = onGoStep(step, data);
            data = {
                ...data,
                ...newProps,
            };
            const {
                redirect,
            } = newProps;
            if (redirect) return;
        }

        const history = [...prevHistory];
        history[step] = accumData;

        const {
            autoStart,
        } = steps[step];

        this.setState(
            {
                currentStep: step,
                currentTask: -1,
                data,
                history,
                loading: autoStart,
            },
            autoStart
                ? ensureMinPendingTime(this.runTask, 600)
                : null,
        );
    }

    renderProgress() {
        const {
            steps,
            currentStep,
            currentTask,
        } = this.state;
        let accumTasks = 0;
        const totalTasks = steps.reduce((sum, {
            tasks,
        }, i) => {
            if (i <= currentStep) {
                accumTasks += (i === currentStep
                    ? currentTask + 1
                    : tasks.length);
            }
            return sum + tasks.length;
        }, 0);

        return (
            <ProgressBar
                className="flex-fixed"
                size="xs"
                base={totalTasks}
                value={accumTasks}
                baseColor="white-lightest"
                activeColor="primary"
            />
        );
    }

    renderContent() {
        const {
            Content,
        } = this.props;

        if (!Content) {
            return null;
        }

        const {
            steps,
            retryWithMetaMaskStep,
            currentStep,
            currentTask,
            data,
            loading,
            error,
        } = this.state;

        const onRetryWithMetaMask = data.isGSNAvailable && retryWithMetaMaskStep
            ? this.handleRetryWithMetaMask
            : null;

        return (
            <Content
                {...data}
                steps={steps}
                currentStep={currentStep}
                currentTask={currentTask}
                loading={loading}
                error={error}
                onPrevious={this.handleGoBack}
                onNext={this.handleSubmit}
                onRetryTask={this.handleRetryTask}
                onRetryStep={this.handleRetryStep}
                onRetryWithMetaMask={onRetryWithMetaMask}
            />
        );
    }

    render() {
        const {
            testId,
        } = this.props;
        const {
            pendingInitialFetch,
        } = this.state;

        if (pendingInitialFetch) {
            return <Loading />;
        }

        return (
            <FlexBox
                testId={testId}
                direction="column"
                expand
                stretch
                nowrap
            >
                {this.renderProgress()}
                {this.renderContent()}
            </FlexBox>
        );
    }
}

StepsHandler.propTypes = {
    testId: PropTypes.string,
    steps: PropTypes.arrayOf(transactionStepShape),
    retryWithMetaMaskStep: transactionStepShape,
    Content: PropTypes.func,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    fetchInitialData: PropTypes.func,
    runTask: PropTypes.func,
    onSubmit: PropTypes.func,
    onGoStep: PropTypes.func,
    onGoBack: PropTypes.func,
    onGoNext: PropTypes.func,
    onExit: PropTypes.func,
    closeDelay: PropTypes.number,
};

StepsHandler.defaultProps = {
    testId: undefined,
    steps: [],
    retryWithMetaMaskStep: null,
    Content: null,
    initialStep: 0,
    initialTask: -1,
    initialData: {},
    fetchInitialData: null,
    runTask: null,
    onSubmit: null,
    onGoStep: null,
    onGoBack: null,
    onGoNext: null,
    onExit: null,
    closeDelay: closeWindowDelay,
};

export default StepsHandler;
