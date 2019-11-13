import React from 'react';
import PropTypes from 'prop-types';
import DomainPermissionTransaction from '~/ui/views/DomainPermissionTransaction';
import AnimatedTransaction from '~/ui/views/handlers/AnimatedTransaction';
import apis from '~uiModules/apis';

const steps = [
    {
        titleKey: 'domain.permission.title',
        tasks: [
            {
                type: 'auth',
                name: 'create',
                run: apis.auth.approveDomain,
            },
        ],
        content: DomainPermissionTransaction,
        submitTextKey: 'domain.permission.submit',
    },
];

const DomainPermission = ({
    domain,
}) => {
    const fetchInitialData = async () => {
        const {
            address,
        } = await apis.auth.getCurrentUser() || {};
        const assets = await apis.asset.getDomainAssets(domain.domain);

        return {
            domain,
            address,
            assets,
        };
    };

    return (
        <AnimatedTransaction
            steps={steps}
            fetchInitialData={fetchInitialData}
        />
    );
};

DomainPermission.propTypes = {
    domain: PropTypes.shape({
        domain: PropTypes.string.isRequired,
    }).isRequired,
};

export default DomainPermission;
