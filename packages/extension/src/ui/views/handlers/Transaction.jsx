import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    warnLog,
} from '~utils/log';
import i18n from '~ui/helpers/i18n';
import closeWindow from '~ui/utils/closeWindow';
import Popup from '~ui/components/Popup';
import Ticket from '~ui/components/Ticket';
import ProgressList from '~ui/components/ProgressList';
import Button from '~ui/components/Button';

class Transaction extends PureComponent {
    constructor(props) {
        super(props);

        const {
            initialStep,
            initialTask,
            initialData,
        } = props;

        this.state = {
            currentStep: initialStep,
            currentTask: initialTask,
            data: initialData,
            pending: true,
            loading: false,
            done: false,
            error: null,
        };
    }

    componentDidMount() {
        const {
            autoStart,
        } = this.props;
        if (autoStart) {
            this.goToNextTask();
        }
    }

    getTask() {
        const {
            steps,
        } = this.props;
        const {
            currentStep,
            currentTask,
        } = this.state;
        const {
            tasks = [],
        } = steps[currentStep] || {};

        return tasks[currentTask];
    }

    getNextTask({ currentStep, currentTask } = this.state) {
        const {
            steps,
        } = this.props;
        const {
            tasks = [],
        } = steps[currentStep] || {};
        const task = tasks[currentTask + 1];

        if (!task && currentStep < steps.length) {
            return this.getNextTask({
                currentStep: currentStep + 1,
                currentTask: -1,
            });
        }

        return {
            task,
            nextStep: currentStep,
            nextTask: currentTask + 1,
        };
    }

    goToNextTask = (newData = {}) => {
        const {
            task,
            nextStep,
            nextTask,
        } = this.getNextTask();
        const {
            data: prevData,
        } = this.state;
        const data = {
            ...prevData,
            ...newData,
        };

        this.setState(
            {
                currentStep: nextStep,
                currentTask: nextTask,
                data,
                pending: false,
                loading: !!task,
                done: !task,
            },
            task
                ? () => this.runTask(task)
                : this.handleTransactionComplete,
        );
    };

    runTask = (task) => {
        const {
            runTask,
        } = this.props;
        const {
            data,
        } = this.state;
        const {
            run,
        } = task;
        if (run) {
            run(data, this.handleResponse);
        } else if (runTask) {
            runTask(task, data, this.handleResponse);
        } else {
            warnLog(`Task '${task.name}' is not handled properly. Please pass 'runTask' to <Transaction /> or assign a custom 'run' to the task in its config.`);
            this.goToNextTask();
        }
    };

    handleResponse = (response = {}) => {
        const {
            error,
            ...data
        } = response;

        if (error) {
            this.setState({
                error,
            });
            return;
        }

        this.goToNextTask(data);
    };

    handleTransactionComplete = () => {
        const {
            goNext,
            autoCloseTimeout,
        } = this.props;
        if (goNext) {
            goNext();
        } else if (autoCloseTimeout) {
            setTimeout(() => closeWindow, autoCloseTimeout);
        }
    };

    renderSteps() {
        const {
            steps,
        } = this.props;
        const {
            currentStep,
            loading,
            error,
        } = this.state;

        return (
            <ProgressList
                steps={steps}
                currentStep={currentStep}
                loading={loading}
                error={(error && error.key) || ''}
            />
        );
    }

    renderSubmitButton = () => {
        const {
            submitButtonText,
            successMessage,
            autoStart,
        } = this.props;
        const {
            pending,
            loading,
            done,
        } = this.state;
        const task = this.getTask();
        const {
            type,
            loadingMessage,
        } = task || {};

        let text;
        let textColor;
        if (done) {
            text = successMessage;
            textColor = 'primary';
        } else if (loading) {
            if (loadingMessage) {
                text = loadingMessage;
                textColor = 'label';
            } else if (type === 'sign') {
                text = i18n.t('transaction.waiting.sign');
                textColor = 'orange';
            }
        }

        if (text) {
            return (
                <Block bottom="s">
                    <Text
                        text={text}
                        color={textColor}
                        size="xs"
                        weight="semibold"
                    />
                </Block>
            );
        }

        if (autoStart) {
            return null;
        }

        return (
            <Button
                text={submitButtonText}
                onClick={this.goToNextTask}
                disabled={!pending}
            />
        );
    };

    render() {
        const {
            title,
            description,
            content,
            ticketHeight,
            goBack,
            onClose,
            renderTicketHeader,
            ticketHeader,
        } = this.props;
        const {
            error,
            loading,
            done,
        } = this.state;

        const ticketHeaderNode = renderTicketHeader
            ? renderTicketHeader()
            : ticketHeader;

        return (
            <Popup
                theme="white"
                title={title}
                description={description || i18n.t('transaction.description')}
                leftIconName={goBack ? 'chevron_left' : 'close'}
                onClickLeftIcon={goBack || onClose}
                disableOnClickLeftIcon={loading || done}
                submitButton={this.renderSubmitButton()}
                error={error}
            >
                {!!content && (
                    <Block
                        bottom="l"
                    >
                        {content}
                    </Block>
                )}
                <Ticket
                    header={ticketHeaderNode}
                    height={ticketHeight}
                >
                    {this.renderSteps()}
                </Ticket>
            </Popup>
        );
    }
}

Transaction.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
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
    submitButtonText: PropTypes.string.isRequired,
    successMessage: PropTypes.string,
    ticketHeight: PropTypes.number,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    renderTicketHeader: PropTypes.func,
    ticketHeader: PropTypes.node,
    runTask: PropTypes.func,
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
    autoStart: PropTypes.bool,
    autoCloseTimeout: PropTypes.number,
};

Transaction.defaultProps = {
    description: '',
    content: null,
    successMessage: '',
    ticketHeight: 6,
    initialStep: -1,
    initialTask: 0,
    initialData: {},
    renderTicketHeader: null,
    runTask: null,
    ticketHeader: null,
    goNext: null,
    goBack: null,
    onClose: null,
    autoStart: false,
    autoCloseTimeout: 2000,
};

export default Transaction;
