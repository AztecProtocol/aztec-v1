import React from 'react';
import PropTypes from 'prop-types';
import {
    ADDRESS_LENGTH,
} from '~/config/constants';
import {
    randomId,
} from '~/utils/random';
import makeAsset from '~/ui/utils/makeAsset';
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
        let assets = await apis.asset.getDomainAssets(domain.domain);
        let assetPlaceholders = [];
        if (assets && assets.length) {
            assets = await Promise.all(assets.map(makeAsset));
        } else {
            assetPlaceholders = [...Array(3)].map(() => ({
                address: `0x${randomId(ADDRESS_LENGTH)}`,
                linkedTokenAddress: `0x${randomId(ADDRESS_LENGTH)}`,
            }));
        }

        return {
            domain,
            assets,
            assetPlaceholders,
        };
    };

    return (
        <AnimatedTransaction
            testId="steps-domain-access"
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
