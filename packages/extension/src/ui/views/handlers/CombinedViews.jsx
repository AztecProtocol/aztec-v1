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
            loading: !!fetchInitialData,
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
    onGoNext: null,
    onExit: null,
    autoClose: false,
    closeDelay: 1500,
};

export default CombinedViews;
