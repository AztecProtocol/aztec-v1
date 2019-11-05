import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
    FlexBox,
} from '@aztec/guacamole-ui';
import {
    warnLog,
    errorLog,
} from '~utils/log';
import {
    closeWindowDelay,
} from '~ui/config/settings';
import i18n from '~ui/helpers/i18n';
import returnAndClose from '~uiModules/helpers/returnAndClose';
import PopupContent from '~ui/components/PopupContent';
import AnimatedContent from './AnimatedContent';
import asyncForEach from '~utils/asyncForEach';
import Footer from '~ui/components/Footer';
import {
    spacingMap,
} from '~ui/styles/guacamole-vars';

class Transaction extends PureComponent {
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
        const {
            initialStep,
            initialTask,
            initialData,
        } = props;

        this.state = {
            step: initialStep,
            data: null,
            history: null,
            loading: false,
            currentTask: initialTask,
            data: initialData,
            direction: 1,
            done: false,
            error: null,
            prevProps: {
                retry: -1,
            },
        };
    }

    componentDidMount() {
        this.fetchInitialData();
    }

    handleGoBack = () => {
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
            }));
        }

        const backToStep = step - stepOffset;
        const historyData = history[backToStep];

        this.goToStep({
            step: backToStep,
            direction: '-1',
            data: {
                ...historyData,
                ...modifiedData,
            },
            history: history.slice(0, backToStep + 1),
        });
    };

    runAsyncTasks = async () => {
        const {
            steps,
            onGoNext,
        } = this.props;
        const {
            step,
            history: prevHistory,
        } = this.state;
        const prevData = prevHistory[step];
        let data = {
            ...prevData,
        };

        if (step === steps.length - 1) {
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

        const newData = await this.runTasks(steps[step].tasks);
        this.setState({
            loading: false,
        });

        this.goToStep({
            step: nextStep,
            direction: '1',
            data: newData,
            history,
        });
    }

    handleGoNext = () => {
        const {
            loading,
        } = this.state;
        if (loading) {
            return;
        }
        this.setState({ loading: true }, this.runAsyncTasks);
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

    getTask() {
        const {
            steps,
        } = this.props;
        const {
            step,
            currentTask,
        } = this.state;
        const {
            tasks = [],
        } = steps[step] || {};

        return tasks[currentTask];
    }

    getNextTask({ step, currentTask } = this.state) {
        const {
            steps,
        } = this.props;
        const {
            tasks = [],
        } = steps[step] || {};
        const task = tasks[currentTask + 1];

        if (!task && step < steps.length) {
            return this.getNextTask({
                step: step + 1,
                currentTask: -1,
            });
        }

        return {
            task,
            nextStep: step,
            nextTask: currentTask + 1,
        };
    }

    runTasks = async (tasks) => {
        const {
            runTask,
        } = this.props;
        let {
            data,
        } = this.state;

        await asyncForEach(tasks, async (task) => {
            let response;
            const {
                run,
            } = task;
            try {
                response = run
                    ? await run(data)
                    : await runTask(task, data);
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
                this.setState({
                    loading: false,
                    error: typeof error === 'string'
                        ? { message: error }
                        : error,
                });
            }
            data = {
                ...data,
                ...response,
            };
        });

        return data;
    };

    handleTransactionComplete = () => {
        const {
            goNext,
            autoClose,
            closeDelay,
        } = this.props;
        const {
            data,
        } = this.state;
        if (goNext) {
            goNext(data);
        } else if (autoClose) {
            returnAndClose(data, closeDelay);
        }
    };

    renderSteps() {
        const {
            steps,
        } = this.props;
        const {
            step,
        } = this.state;

        return (
            <Block padding="m s">
                <Text
                    text={i18n.t(steps[step].titleKey)}
                    size="m"
                    weight="semibold"
                />
                <FlexBox
                    expand
                    direction="row"
                    align="center"
                >
                    {
                        steps.map(
                            (s, i) => (
                                <Block
                                    background={i <= step ? 'primary' : 'primary-lightest'}
                                    borderRadius="s"
                                    padding="xxs l"
                                    key={i}
                                    style={{
                                        margin: `${spacingMap.xs}`,
                                    }}
                                />
                            ),
                        )
                    }
                </FlexBox>
            </Block>
        );
    }


    renderFooter = () => {
        const {
            steps,
        } = this.props;
        const {
            step,
            loading,
        } = this.state;
        return (

            <Footer
                cancelText={i18n.t(steps[step].cancelText)}
                nextText={i18n.t(steps[step].submitText)}
                loading={loading}
                onNext={this.handleGoNext}
                onPrevious={this.handleGoBack}
            />
        );
    }

    renderContent({ content: Component }) {
        return <Component {...this.state.data} />;
    }

    render() {
        const {
            tasks,
            steps,
        } = this.props;
        const {
            error,
            loading,
            step,
            direction,
        } = this.state;

        return (
            <FlexBox
                direction="column"
                expand
                stretch
                nowrap
            >
                <AnimatedContent
                    animationType="header"
                    className="flex-fixed"
                    direction={direction}
                    animationKey={step}
                >
                    {this.renderSteps(steps[step])}
                </AnimatedContent>

                <AnimatedContent
                    animationType="content"
                    direction={direction}
                    className="flex-free-expand"
                    animationKey={step}
                >
                    {this.renderContent(steps[step])}
                </AnimatedContent>
                <AnimatedContent
                    animationType="footer"
                    direction={direction}
                    className="flex-fixed"
                    animationKey={step}
                >
                    {this.renderFooter(steps[step])}
                </AnimatedContent>
            </FlexBox>
        );
    }
}

Transaction.propTypes = {
    content: PropTypes.node,
    steps: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string,
        titleKey: PropTypes.string,
        tasks: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            type: PropTypes.string,
            loadingMessage: PropTypes.string,
            run: PropTypes.func,
        })),
    })).isRequired,
    successMessage: PropTypes.string,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    runTask: PropTypes.func,
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
    autoStart: PropTypes.bool,
    autoClose: PropTypes.bool,
    closeDelay: PropTypes.number,
};

Transaction.defaultProps = {
    content: null,
    successMessage: '',
    initialStep: 0,
    initialTask: 0,
    initialData: {},
    runTask: null,
    goNext: null,
    goBack: null,
    onClose: null,
    autoStart: false,
    autoClose: false,
    closeDelay: closeWindowDelay,
};

export default Transaction;
