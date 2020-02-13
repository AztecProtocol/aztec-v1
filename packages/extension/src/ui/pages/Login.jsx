import React from 'react';
import PropTypes from 'prop-types';
import apis from '~uiModules/apis';
import AnimatedTransaction from '~/ui/views/handlers/AnimatedTransaction';
import LoginWithPassword from '~/ui/views/LoginWithPassword';

const steps = [
    {
        titleKey: 'account.login.title',
        content: LoginWithPassword,
        tasks: [
            {
                name: 'login',
                run: apis.auth.login,
            },
        ],
        submitTextKey: 'account.login.submit',
        onSubmit: ({ password }) => {
            if (!password || !password.trim()) {
                return {
                    error: {
                        key: 'account.password.error.empty',
                    },
                };
            }
            return null;
        },
    },
];

const Login = ({
    currentAccount,
}) => (
    <AnimatedTransaction
        testId="steps-login"
        steps={steps}
        initialData={{
            address: currentAccount.address,
        }}
    />
);

Login.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
};

export default Login;
