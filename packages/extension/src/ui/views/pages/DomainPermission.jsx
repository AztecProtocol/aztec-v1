import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import DomainPermissionTransaction from '~ui/views/DomainPermissionTransaction';
import Loading from '~ui/views/Loading';
import {
    getDomainAssets,
} from '~ui/apis/assets';
import {
    getCurrentUser,
    approveDomain,
} from '~ui/apis/auth';
import closeWindow from '~ui/utils/closeWindow';

class DomainPermission extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            address: '',
            assets: [],
            loading: false,
            success: false,
            error: '',
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

    handleResponse = (response) => {
        const {
            success,
        } = response;
        if (!success) {
            this.setState({
                error: {
                    key: 'domain.permission.grant.error',
                },
                loading: false,
            });
        } else {
            this.setState({
                loading: false,
                success: true,
            }, () => closeWindow(500));
        }
    };

    async approveDomain() {
        const {
            address,
        } = this.state;
        const {
            domain,
        } = this.props;

        await approveDomain(
            {
                address,
                domain: domain.domain,
            },
            this.handleResponse,
        );
    }

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
            <DomainPermissionTransaction
                address={address}
                domain={domain}
                assets={assets}
                loading={loading}
                success={success}
                error={error}
                goNext={this.handleSubmit}
            />
        );
    }
}

DomainPermission.propTypes = {
    domain: PropTypes.shape({
        name: PropTypes.string.isRequired,
        domain: PropTypes.string.isRequired,
        iconSrc: PropTypes.string,
    }).isRequired,
};

export default DomainPermission;
