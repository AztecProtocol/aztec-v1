import React from 'react';
import PropTypes from 'prop-types';
import returnAndClose from '~ui/helpers/returnAndClose';
import CombinedViews from '~ui/views/handlers/CombinedViews';
import LoginTransaction from '~ui/views/LoginTransaction';

const Steps = [
    LoginTransaction,
];

const Login = ({
    actionId,
    currentAccount,
    goToPage,
}) => (
    <CombinedViews
        Steps={Steps}
        initialData={{
            currentAccount,
        }}
        onExit={actionId
            ? returnAndClose
            : ({ loggedIn }) => goToPage(loggedIn ? 'account' : 'account.restore')}
    />
);

Login.propTypes = {
    actionId: PropTypes.string,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    goToPage: PropTypes.func.isRequired,
};

Login.defaultProps = {
    actionId: '',
};

export default Login;
