import React from 'react';
import PropTypes from 'prop-types';
import returnAndClose from '~ui/helpers/returnAndClose';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import LoginTransaction from '~ui/views/LoginTransaction';

const steps = [
    {
        content: LoginTransaction,
    },
];

const Login = ({
    currentAccount,
}) => (
    <AnimatedTransaction
        steps={steps}
        initialData={{
            currentAccount,
        }}
        onExit={returnAndClose}
    />
);

Login.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
};

export default Login;
