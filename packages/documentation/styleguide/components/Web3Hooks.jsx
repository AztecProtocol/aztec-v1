import React, { useState } from 'react';
import Web3 from 'web3';

const withWeb3 = (Component) => {
  const [accounts, setAccounts] = useState([]);
  const [network, setNetwork] = useState('4');
  const [ethBalance, setEthBalance] = useState(0);

  if (window.ethereum) {
    window.ethereum.on('accountsChanged', setAccounts);
    window.ethereum.on('networkChanged', setNetwork);
    const web3 = new Web3(window.ethereum);
    const balance = web3.eth.getBalance(accounts[0]); // Will give value in.
    setEthBalance(web3.toDecimal(balance));
  }


  return (
    <Component web3Props={{
      accounts,
      network,
      ethBalance,
    }}
    />
  );
};

export default withWeb3;

