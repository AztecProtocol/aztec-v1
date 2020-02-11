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
    errorLog,
} from '~/utils/log';
import {
    closeWindowDelay,
} from '~/ui/config/settings';
import closeWindow from '~/ui/utils/closeWindow';
import i18n from '~/ui/helpers/i18n';
import returnAndClose from '~uiModules/helpers/returnAndClose';
import Footer from '~/ui/components/Footer';
import Loading from '~/ui/views/Loading';
import AnimatedContent from './AnimatedContent';

class AnimatedTransaction extends PureComponent {
    constructor(props) {
        super(props);
        const {
            steps,
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
            step: initialStep,
            currentTask: initialTask,
            data: initialData,
            history,
            pendingInitialFetch: !!fetchInitialData,
            loading: false,
            direction: 1,
            error: null,
            childError: null,
        };
    }

    componentDidMount() {
        this.fetchInitialData();
    }

    handleSubmit = async () => {
        const {
            loading,
        } = this.state;
        if (loading) {
            return;
        }

        this.setState(
            { loading: true },
            this.validateSubmitData,
        );
    };

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
            } = onGoBack(step, prevData));

            if (modifiedData.redirect) return;
        }

        const backToStep = step - stepOffset;
        const historyData = history[backToStep];

        this.goToStep(backToStep, {
            ...historyData,
            ...modifiedData,
        });
    };

    updateParentState = (childState) => {
        const {
            data: prevData,
            error,
        } = this.state;
        if (error) return;

        const {
            error: childError,
            ...childData
        } = childState;
        this.setState({
            data: {
                ...prevData,
                ...childData,
            },
            childError,
        });
    }

    handleClearError = () => {
        this.setState({
            currentTask: -1,
            error: null,
        });
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
            ...newData
        } = await fetchInitialData();

        const {
            steps: initialSteps,
            step,
            history: prevHistory,
        } = this.state;
        const data = {
            ...initialData,
            ...newData,
        };
        const history = [...prevHistory];
        history[step] = data;

        this.setState({
            steps: steps || initialSteps,
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
            steps,
            step,
            data: prevData,
        } = this.state;
        const {
            onSubmit: stepOnSubmit,
        } = steps[step];

        let data = prevData;
        if (stepOnSubmit) {
            const {
                error: childError,
                ...extraData
            } = await stepOnSubmit(data) || {};
            if (childError) {
                this.setState({
                    loading: false,
                    childError,
                });
                return;
            }
            data = {
                ...data,
                ...extraData,
            };
        }

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

    async handleGoNext(accumData) {
        const {
            onGoNext,
        } = this.props;
        const {
            steps,
            step,
        } = this.state;
        const {
            onGoNext: stepOnGoNext,
        } = steps[step];

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
                } = fn(data, step) || {};

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

        const nextStep = step + stepOffset;

        this.goToStep(nextStep, accumData);
    }

    async runTask(accumData = null) {
        const {
            runTask,
        } = this.props;
        const {
            steps,
            step,
            currentTask: prevTask,
            data: prevData,
        } = this.state;
        const {
            tasks = [],
        } = steps[step] || {};
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
            this.handleError(error);
            return;
        }

        data = {
            ...data,
            ...response,
        };

        if (currentTask === tasks.length - 1) {
            this.handleGoNext(data);
            return;
        }

        this.setState(
            {
                currentTask,
                data,
            },
            this.runTask,
        );
    }

    goToStep(step, accumData) {
        const {
            steps,
            step: prevStep,
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

        this.setState({
            step,
            currentTask: -1,
            data,
            history,
            loading: false,
            direction: step > prevStep ? 1 : -1,
        });
    }

    renderHeader() {
        const {
            steps,
            step,
        } = this.state;
        const {
            title,
            titleKey,
        } = steps[step];
        const titleText = title
            || (titleKey && i18n.t(titleKey));

        if (!titleText && steps.length <= 1) {
            return null;
        }

        return (
            <Block padding="s">
                {!!titleText && (
                    <Block padding="xs s">
                        <Text
                            text={titleText}
                            size="l"
                            weight="normal"
                        />
                    </Block>
                )}
                {steps.length > 1 && (
                    <Block padding="xs s">
                        <FlexBox
                            expand
                            direction="row"
                            align="center"
                        >
                            {steps.map((s, i) => (
                                <Block
                                    key={+i}
                                    padding="xs"
                                    inline
                                >
                                    <Block
                                        background={i <= step ? 'primary' : 'primary-lightest'}
                                        borderRadius="s"
                                        padding="xxs l"
                                    />
                                </Block>
                            ))}
                        </FlexBox>
                    </Block>
                )}
            </Block>
        );
    }

    renderFooter = () => {
        const {
            steps,
            step,
            currentTask,
            loading,
            error,
        } = this.state;
        const {
            cancelText,
            cancelTextKey,
            submitText,
            submitTextKey,
            tasks = [],
        } = steps[step];
        const {
            type: taskType,
        } = tasks[currentTask] || {};

        return (
            <Footer
                taskType={taskType}
                cancelText={cancelText
                    || (cancelTextKey && i18n.t(cancelTextKey))
                    || (step === 0 && i18n.t('cancel'))
                    || i18n.t('go.back')}
                nextText={submitText
                    || (submitTextKey && i18n.t(submitTextKey))
                    || i18n.t('next')}
                onPrevious={this.handleGoBack}
                onNext={this.handleSubmit}
                onRetry={this.handleClearError}
                disableOnNext={step === steps.length}
                loading={loading}
                error={error}
            />
        );
    }

    renderContent() {
        const {
            steps,
            step,
            data,
            childError,
        } = this.state;
        const {
            content: Component,
            contentProps,
        } = steps[step];

        return (
            <Component
                {...contentProps}
                {...data}
                error={childError}
                updateParentState={this.updateParentState}
            />
        );
    }

    render() {
        const {
            testId,
        } = this.props;
        const {
            pendingInitialFetch,
            step,
            direction,
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
                <AnimatedContent
                    className="flex-fixed"
                    animationType="header"
                    direction={`${direction}`}
                    animationKey={step}
                >
                    {this.renderHeader()}
                </AnimatedContent>
                <AnimatedContent
                    className="flex-free-expand"
                    animationType="content"
                    direction={`${direction}`}
                    animationKey={step}
                >
                    {this.renderContent()}
                </AnimatedContent>
                <AnimatedContent
                    className="flex-fixed"
                    animationType="footer"
                    direction={`${direction}`}
                    animationKey={step}
                >
                    {this.renderFooter()}
                </AnimatedContent>
            </FlexBox>
        );
    }
}

AnimatedTransaction.propTypes = {
    testId: PropTypes.string,
    steps: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string,
        titleKey: PropTypes.string,
        tasks: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            type: PropTypes.string,
            run: PropTypes.func,
        })),
        content: PropTypes.func,
        contentProps: PropTypes.object,
        onSubmit: PropTypes.func,
        onGoNext: PropTypes.func,
        cancelText: PropTypes.string,
        cancelTextKey: PropTypes.string,
        submitText: PropTypes.string,
        submitTextKey: PropTypes.string,
    })),
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

AnimatedTransaction.defaultProps = {
    testId: undefined,
    steps: [],
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

export default AnimatedTransaction;
