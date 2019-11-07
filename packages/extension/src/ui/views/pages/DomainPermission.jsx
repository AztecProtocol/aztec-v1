import React, {
    PureComponent,
} from 'react'; import PropTypes from 'prop-types';
import DomainPermissionTransaction from '~ui/views/DomainPermissionTransaction';
import returnAndClose from '~ui/helpers/returnAndClose';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import Loading from '~ui/views/Loading';
import {
    getDomainAssets,
} from '~ui/apis/asset';
import {
    getCurrentUser,
    approveDomain,
} from '~ui/apis/auth';

const steps = [
    {
        titleKey: 'domain.permission.title',
        tasks: [
            {
                type: 'auth',
                name: 'create',
                run: approveDomain,
            },
        ],
        content: DomainPermissionTransaction,
        submitText: 'domain.permission.submitText',
        cancelText: 'domain.permission.cancelText',
    },
];

class DomainPermission extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            address: '',
            assets: [],
            loading: false,
            success: false,
            error: null,
        };
    }

    componentDidMount() {
        this.fetchDataForPage();
    }

    handleSubmit = () => {
        this.setState({
            loading: true,
        }, this.approveDomain);
    };


    async fetchDataForPage() {
        const {
            address,
        } = await getCurrentUser() || {};
        const {
            domain,
        } = this.props;
        const assets = await getDomainAssets(domain.domain);

        this.setState({
            address,
            assets,
        });
    }

    render() {
        const {
            address,
        } = this.state;

        if (!address) {
            return <Loading />;
        }

        const {
            domain,
        } = this.props;
        const {
            assets,
            loading,
            success,
            error,
        } = this.state;

        return (
            <AnimatedTransaction
                steps={steps}
                initialStep={0}
                onExit={returnAndClose}
                initialData={{
                    address,
                    domain,
                    assets,
                    loading,
                    success,
                    error,
                }}
            />

        );
    }
}

DomainPermission.propTypes = {
    domain: PropTypes.shape({
        domain: PropTypes.string.isRequired,
    }).isRequired,
};

export default DomainPermission;
