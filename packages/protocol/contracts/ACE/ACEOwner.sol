pragma solidity >=0.5.0 <0.6.0;

import "../MultiSig/MultiSigWalletWithTimeLock.sol";

/**
 * @title The ACE Owner
 * @author AZTEC
 * @dev /
 * 
 * Copyright 2020 Spilsbury Holdings Ltd 
 *
 * Licensed under the GNU Lesser General Public Licence, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 **/
contract ACEOwner is MultiSigWalletWithTimeLock {
    constructor(
        address[] memory _owners,
        uint256 _required,
        uint256 _secondsTimeLocked
    ) public MultiSigWalletWithTimeLock(
        _owners,
        _required,
        _secondsTimeLocked
    ) {
    }

    function emergencyExecuteInvalidateProof(uint256 transactionId)
        public
        notExecuted(transactionId)
        fullyConfirmed(transactionId)
    {
        Transaction storage txn = transactions[transactionId];
        bytes memory txData = txn.data;

        // Revert unless method signature in data is signature for invalidateProof(uint24 _proof)
        assembly {
            switch eq(shr(224, mload(add(txData, 0x20))), 0xcaaaa5d8)
            case 0 {
                revert(0x00, 0x00)
            }
        }
        txn.executed = true;
        if (external_call(txn.destination, txn.value, txn.data.length, txn.data)) {
            emit Execution(transactionId);
        } else {
            emit ExecutionFailure(transactionId);
            txn.executed = false;
        }
    }
}
