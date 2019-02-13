pragma solidity ^0.4.24;

/*
 * We need to upgrade to ^0.5.0 to integrate this interface: https://github.com/ethereum/solidity/issues/4832
 */
interface IZKERC20 {

    event CreateNoteRegistry(
        address _noteRegistry
    );
    event CreateZKERC20(
        bool _canMint,
        bool _canBurn,
        bool _canConvert,
        uint256 _scalingFactor,
        address _linkedToken,
        address _ace
    );
    event CreateNote(
        bytes32 indexed _noteHash, 
        address indexed _owner, 
        bytes _metadata
    );
    event DestroyNote(
        bytes32 indexed _noteHash, 
        address indexed _owner, 
        bytes _metadata
    );
    event ConvertTokens(
        address indexed _owner, 
        uint256 _value
    );
    event RedeemTokens(
        address indexed _owner, 
        uint256 _value
    );

    function confidentialApprove(
        bytes32 _noteHash,
        address _spender,
        bool _status,
        bytes _signature
    ) 
        external 
        returns (bool);
    function confidentialTransfer(
        bytes _proofData
    ) 
        external 
        returns (bool);
    function confidentialTransferFrom(
        uint16 _proofId, 
        bytes _proofOutput
    ) 
        external 
        returns (bool);
}
