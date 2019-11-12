import React from 'react';
import PropTypes from 'prop-types';
import returnAndClose from '~ui/helpers/returnAndClose';
import CombinedViews from '~ui/views/handlers/CombinedViews';
import RegisterAddressTransaction from '~ui/views/RegisterAddressTransaction';

const Steps = [
    RegisterAddressTransaction,
];

const RegisterAddress = ({
    actionId,
    currentAccount,
    goToPage,
}) => (
    <CombinedViews
        Steps={Steps}
        initialData={{
            ...currentAccount,
            address: currentAccount.address,
        }}
        onExit={actionId ? returnAndClose : () => goToPage('account')}
    />
);

RegisterAddress.propTypes = {
    actionId: PropTypes.string,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string.isRequired,
    }).isRequired,
    goToPage: PropTypes.func.isRequired,
};

RegisterAddress.defaultProps = {
    actionId: '',
};

export default RegisterAddress;
