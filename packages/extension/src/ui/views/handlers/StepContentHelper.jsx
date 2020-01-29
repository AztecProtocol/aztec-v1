import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
    Icon,
    Loader,
    SVG,
} from '@aztec/guacamole-ui';
import {
    transactionStepShape,
    errorShape,
} from '~/ui/config/propTypes';
import i18n from '~/ui/helpers/i18n';
import ensureMinPendingTime from '~/ui/utils/ensureMinPendingTime';
import ListItem from '~/ui/components/ListItem';
import {
    colorMap,
    iconSizeMap,
} from '~/ui/styles/guacamole-vars';
import checkGlyph from '~/ui/images/tick.svg';

class StepContentHelper extends PureComponent {
    static getDerivedStateFromProps(nextProps, prevState) {
        const {
            steps,
            currentStep,
            currentTask,
            loading,
        } = nextProps;
        const {
            explicitTaskType: prevExplicitTaskType,
            prevStep,
            prevTask,
        } = prevState;
        const nextTask = steps[currentStep].tasks[currentTask + 1] || {};

        let explicitTaskType = prevExplicitTaskType;
        if (loading && nextTask.type === 'sign') {
            explicitTaskType = 'sign';
        } else if (currentStep !== prevStep
            || currentTask !== prevTask
        ) {
            explicitTaskType = '';
        }

        return {
            explicitTaskType,
            prevStep: currentStep,
            prevTask: currentTask,
        };
    }

    constructor(props) {
        super(props);

        this.state = {
            data: {},
            error: null,
            explicitTaskType: '',
            prevStep: 0,
            prevTask: -1,
        };
    }

    getStepConfig() {
        const {
            title: defaultTitle,
            titleKey: defaultTitleKey,
            steps,
            currentStep,
            loading,
            error,
            onPrevious,
        } = this.props;
        const {
            error: childError,
        } = this.state;
        const {
            title,
            titleKey,
            description,
            descriptionKey,
            cancelText,
            cancelTextKey,
            submitText,
            submitTextKey,
        } = steps[currentStep];

        return {
            title: title || defaultTitle,
            titleKey: titleKey || defaultTitleKey,
            description,
            descriptionKey,
            cancelText,
            cancelTextKey,
            submitText,
            submitTextKey,
            submitMessage: this.renderSubmitMessage(),
            loading,
            error,
            childError,
            onPrevious,
            onNext: this.handleGoNext,
            onRetry: this.handleRetry,
        };
    }

    getCurrentStep() {
        const {
            steps,
            currentStep,
        } = this.props;

        return steps[currentStep];
    }

    getCurrentTask() {
        const {
            steps,
            currentStep,
            currentTask,
        } = this.props;

        return steps[currentStep].tasks[currentTask];
    }

    getNextTask() {
        const {
            steps,
            currentStep,
            currentTask,
        } = this.props;
        let task = steps[currentStep].tasks[currentTask + 1];
        if (!task) {
            [task] = steps[currentStep + 1].tasks || [];
        }

        return task;
    }

    handleRetry = () => {
        const {
            onRetryStep,
            onRetryTask,
        } = this.props;
        const {
            explicitTaskType,
        } = this.state;

        if (explicitTaskType) {
            onRetryTask();
            return;
        }

        onRetryStep();
    };

    handleGoNext = () => {
        const error = this.validateSubmitData();
        if (error) {
            this.setState({
                error,
            });
            return;
        }

        const {
            onNext,
        } = this.props;
        const {
            data,
        } = this.state;

        const nextTask = this.getNextTask();
        const nextTaskType = nextTask && nextTask.type;
        if (nextTaskType === 'sign') {
            this.setState(
                {
                    explicitTaskType: nextTaskType,
                },
                ensureMinPendingTime(() => onNext(data), 1000),
            );
            return;
        }

        onNext(data);
    };

    validateSubmitData() { // eslint-disable-line class-methods-use-this
        return null;
    }

    updateData(data) {
        const {
            data: prevData,
        } = this.state;

        this.setState({
            data: {
                ...prevData,
                ...data,
            },
        });
    }

    clearError() {
        this.setState({
            error: null,
        });
    }

    renderSubmitMessage() {
        let submitMessage = null;
        const {
            steps,
            currentStep,
            loading,
        } = this.props;
        const {
            explicitTaskType,
        } = this.state;

        if (explicitTaskType === 'sign') {
            const task = this.getNextTask();
            if (task) {
                submitMessage = (
                    <Text
                        text={task.message || i18n.t('transaction.waiting.sign')}
                        color="orange"
                        size="s"
                    />
                );
            }
        } else if (loading && currentStep === steps.length - 1) {
            submitMessage = (
                <Text
                    text={i18n.t('transaction.autoClose')}
                    color="label"
                    size="xs"
                />
            );
        }

        return submitMessage;
    }

    renderTaskList() {
        const {
            currentTask,
            error,
        } = this.props;
        const {
            tasks,
        } = this.getCurrentStep();

        return (
            <Block padding="m xl">
                {tasks.map(({
                    title,
                    titleKey,
                    run,
                }, i) => {
                    const isFinished = i <= currentTask
                        || (!run && (i === currentTask + 1));
                    let statusIcon = null;
                    if (error && i === currentTask + 1) {
                        statusIcon = (
                            <Icon
                                name="error"
                                color="red"
                                size="s"
                            />
                        );
                    } else if (isFinished) {
                        statusIcon = (
                            <SVG
                                glyph={checkGlyph}
                                fill={colorMap.primary}
                                width={iconSizeMap.s}
                                height={iconSizeMap.s}
                            />
                        );
                    } else if (i === currentTask + 1) {
                        statusIcon = (
                            <Loader
                                size="xxs"
                                theme="primary"
                            />
                        );
                    }

                    return (
                        <Block
                            key={+i}
                            padding="xs 0"
                        >
                            <ListItem
                                content={(
                                    <Text
                                        text={title || i18n.t(titleKey)}
                                        color={i > currentTask + 1 ? 'label' : 'default'}
                                        size="xs"
                                    />
                                )}
                                footnote={statusIcon}
                                textSize="s"
                            />
                        </Block>
                    );
                })}
            </Block>
        );
    }
}

StepContentHelper.propTypes = {
    title: PropTypes.string,
    titleKey: PropTypes.string,
    steps: PropTypes.arrayOf(transactionStepShape).isRequired,
    currentStep: PropTypes.number.isRequired,
    currentTask: PropTypes.number.isRequired,
    loading: PropTypes.bool.isRequired,
    error: errorShape,
    onPrevious: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    onRetryStep: PropTypes.func.isRequired,
    onRetryTask: PropTypes.func.isRequired,
};

StepContentHelper.defaultProps = {
    title: '',
    titleKey: 'deposit.title',
    error: null,
};

export default StepContentHelper;
