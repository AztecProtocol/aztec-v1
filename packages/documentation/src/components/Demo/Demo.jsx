import React, { useState } from 'react';

import { Button } from '@aztec/guacamole-ui';
import '@aztec/guacamole-ui/dist/styles/guacamole.css';
import ReactJson from 'react-json-view';

/**
 * General component description in JSDoc format. Markdown is *supported*.
 */
export default ({ demoScript, text, steps }) => {
    const [isLoading, toggleLoading] = useState(false);
    const [result, setResult] = useState(null);
    return (
        <div>
            <Button // make a button
                onClick={async () => {
                    toggleLoading(true);
                    const response = await demoScript(toggleLoading);
                    setResult(response);
                    toggleLoading(false);
                }}
                text={text}
                isLoading={isLoading}
                loading={isLoading}
            />
            {
                // transactionReceipt && <TransactionReceipt />
            }
            {result && <ReactJson src={result} theme="monokai" />}
        </div>
    );
};
