pragma solidity >=0.5.0 <0.6.0;

/**
 * @title IACE
 * @author AZTEC
 * @dev Standard defining the interface for ACE.sol
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
contract IACE {

    uint8 public latestEpoch;

    /**
    * @dev Burn AZTEC notes
    *
    * @param _proof the AZTEC proof object
    * @param _proofData the burn proof construction data
    * @param _proofSender the Ethereum address of the original transaction sender. It is explicitly assumed that
    *        an asset using ACE supplies this field correctly - if they don't their asset is vulnerable to front-running
    * Unnamed param is the AZTEC zero-knowledge proof data
    * @return two `bytes` objects. The first contains the new confidentialTotalSupply note and the second contains the
    * notes that were created. Returned so that a zkAsset can emit the appropriate events
    */
    function burn(
        uint24 _proof,
        bytes calldata _proofData,
        address _proofSender
    ) external returns (bytes memory);


        /**
    * @dev Default noteRegistry creation method. Doesn't take the id of the factory to use,
            but generates it based on defaults and on the passed flags.
    *
    * @param _linkedTokenAddress - address of any erc20 linked token (can not be 0x0 if canConvert is true)
    * @param _scalingFactor - defines the number of tokens that an AZTEC note value of 1 maps to.
    * @param _canAdjustSupply - whether the noteRegistry can make use of minting and burning
    * @param _canConvert - whether the noteRegistry can transfer value from private to public
        representation and vice versa
    */
    function createNoteRegistry(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) external;

    /**
    * @dev NoteRegistry creation method. Takes an id of the factory to use.
    *
    * @param _linkedTokenAddress - address of any erc20 linked token (can not be 0x0 if canConvert is true)
    * @param _scalingFactor - defines the number of tokens that an AZTEC note value of 1 maps to.
    * @param _canAdjustSupply - whether the noteRegistry can make use of minting and burning
    * @param _canConvert - whether the noteRegistry can transfer value from private to public
        representation and vice versa
    * @param _factoryId - uint24 which contains 3 uint8s representing (epoch, cryptoSystem, assetType)
    */
    function createNoteRegistry(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert,
        uint24 _factoryId
    ) external;

    /**
    * @dev Clear storage variables set when validating zero-knowledge proofs.
    *      The only address that can clear data from `validatedProofs` is the address that created the proof.
    *      Function is designed to utilize [EIP-1283](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1283.md)
    *      to reduce gas costs. It is highly likely that any storage variables set by `validateProof`
    *      are only required for the duration of a single transaction.
    *      E.g. a decentralized exchange validating a swap proof and sending transfer instructions to
    *      two confidential assets.
    *      This method allows the calling smart contract to recover most of the gas spent by setting `validatedProofs`
    * @param _proof the AZTEC proof object
    * @param _proofHashes dynamic array of proof hashes
    */
    function clearProofByHashes(uint24 _proof, bytes32[] calldata _proofHashes) external;

    /**
    * @dev Returns the common reference string.
    * We use a custom getter for `commonReferenceString` - the default getter created by making the storage
    * variable public indexes individual elements of the array, and we want to return the whole array
    */
    function getCommonReferenceString() external view returns (bytes32[6] memory);


    /**
    * @dev Get the factory address associated with a particular factoryId. Fail if resulting address is 0x0.
    *
    * @param _factoryId - uint24 which contains 3 uint8s representing (epoch, cryptoSystem, assetType)
    */
    function getFactoryAddress(uint24 _factoryId) external view returns (address factoryAddress);

    /**
     * @dev Returns the registry for a given address.
     *
     * @param _registryOwner - address of the registry owner in question
     *
     * @return linkedTokenAddress - public ERC20 token that is linked to the NoteRegistry. This is used to
     * transfer public value into and out of the system
     * @return scalingFactor - defines how many ERC20 tokens are represented by one AZTEC note
     * @return totalSupply - represents the total current supply of public tokens associated with a particular registry
     * @return confidentialTotalMinted - keccak256 hash of the note representing the total minted supply
     * @return confidentialTotalBurned - keccak256 hash of the note representing the total burned supply
     * @return canConvert - flag set by the owner to decide whether the registry has public to private, and
     * vice versa, conversion privilege
     * @return canAdjustSupply - determines whether the registry has minting and burning privileges
     */
    function getRegistry(address _registryOwner) external view returns (
        address linkedToken,
        uint256 scalingFactor,
        bytes32 confidentialTotalMinted,
        bytes32 confidentialTotalBurned,
        uint256 totalSupply,
        uint256 totalSupplemented,
        bool canConvert,
        bool canAdjustSupply
    );

    /**
     * @dev Returns the note for a given address and note hash.
     *
     * @param _registryOwner - address of the registry owner
     * @param _noteHash - keccak256 hash of the note coordiantes (gamma and sigma)
     *
     * @return status - status of the note, details whether the note is in a note registry
     * or has been destroyed
     * @return createdOn - time the note was created
     * @return destroyedOn - time the note was destroyed
     * @return noteOwner - address of the note owner
     */
    function getNote(address _registryOwner, bytes32 _noteHash) external view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    );

    /**
    * @dev Get the address of the relevant validator contract
    *
    * @param _proof unique identifier of a particular proof
    * @return validatorAddress - the address of the validator contract
    */
    function getValidatorAddress(uint24 _proof) external view returns (address validatorAddress);

    /**
    * @dev Increment the default registry epoch
    */
    function incrementDefaultRegistryEpoch() external;

    /**
     * @dev Increments the `latestEpoch` storage variable.
     */
    function incrementLatestEpoch() external;

    /**
    * @dev Forever invalidate the given proof.
    * @param _proof the AZTEC proof object
    */
    function invalidateProof(uint24 _proof) external;
        
    function isOwner() external view returns (bool);

    /**
    * @dev Mint AZTEC notes
    *
    * @param _proof the AZTEC proof object
    * @param _proofData the mint proof construction data
    * @param _proofSender the Ethereum address of the original transaction sender. It is explicitly assumed that
    *        an asset using ACE supplies this field correctly - if they don't their asset is vulnerable to front-running
    * Unnamed param is the AZTEC zero-knowledge proof data
    * @return two `bytes` objects. The first contains the new confidentialTotalSupply note and the second contains the
    * notes that were created. Returned so that a zkAsset can emit the appropriate events
    */
    function mint(
        uint24 _proof,
        bytes calldata _proofData,
        address _proofSender
    ) external returns (bytes memory);
    

    function owner() external returns (address);

    /**
    * @dev Adds a public approval record to the noteRegistry, for use by ACE when it needs to transfer
        public tokens it holds to an external address. It needs to be associated with the hash of a proof.
    */
    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) external;


    function renounceOwnership() external;

    /**
    * @dev Set the common reference string.
    *      If the trusted setup is re-run, we will need to be able to change the crs
    * @param _commonReferenceString the new commonReferenceString
    */
    function setCommonReferenceString(bytes32[6] calldata _commonReferenceString) external;

    /**
    * @dev Set the default crypto system to be used
    * @param _defaultCryptoSystem - default crypto system identifier
    */
    function setDefaultCryptoSystem(uint8 _defaultCryptoSystem) external;

    /**
    * @dev Register a new Factory, iff no factory for that ID exists.
            The epoch of any new factory must be at least as big as
            the default registry epoch. Each asset type for each cryptosystem for
            each epoch should have a note registry
    *
    * @param _factoryId - uint24 which contains 3 uint8s representing (epoch, cryptoSystem, assetType)
    * @param _factoryAddress - address of the deployed factory
    */
    function setFactory(uint24 _factoryId, address _factoryAddress) external;

    /**
    * @dev Adds or modifies a proof into the Cryptography Engine.
    *       This method links a given `_proof` to a smart contract validator.
    * @param _proof the AZTEC proof object
    * @param _validatorAddress the address of the smart contract validator
    */
    function setProof(
        uint24 _proof,
        address _validatorAddress
    ) external;

    /**
    * @dev called when a mintable and convertible asset wants to perform an
            action which puts the zero-knowledge and public
            balance out of balance. For example, if minting in zero-knowledge, some
            public tokens need to be added to the pool
            managed by ACE, otherwise any private->public conversion runs the risk of not
            having any public tokens to send.
    *
    * @param _value the value to be added
    */
    function supplementTokens(uint256 _value) external;

    function transferOwnership(address newOwner) external;


    /**
    * @dev Validate an AZTEC zero-knowledge proof. ACE will issue a validation transaction to the smart contract
    *      linked to `_proof`. The validator smart contract will have the following interface:
    *
    *      function validate(
    *          bytes _proofData,
    *          address _sender,
    *          bytes32[6] _commonReferenceString
    *      ) public returns (bytes)
    *
    * @param _proof the AZTEC proof object
    * @param _sender the Ethereum address of the original transaction sender. It is explicitly assumed that
    *        an asset using ACE supplies this field correctly - if they don't their asset is vulnerable to front-running
    * Unnamed param is the AZTEC zero-knowledge proof data
    * @return a `bytes proofOutputs` variable formatted according to the Cryptography Engine standard
    */
    function validateProof(uint24 _proof, address _sender, bytes calldata) external returns (bytes memory);

    /**
    * @dev Validate a previously validated AZTEC proof via its hash
    *      This enables confidential assets to receive transfer instructions from a dApp that
    *      has already validated an AZTEC proof that satisfies a balancing relationship.
    * @param _proof the AZTEC proof object
    * @param _proofHash the hash of the `proofOutput` received by the asset
    * @param _sender the Ethereum address of the contract issuing the transfer instruction
    * @return a boolean that signifies whether the corresponding AZTEC proof has been validated
    */
    function validateProofByHash(uint24 _proof, bytes32 _proofHash, address _sender) external view returns (bool);

    /**
    * @dev Method to upgrade the registry linked with the msg.sender to a new factory, based on _factoryId.
    * The submitted _factoryId must be of epoch equal or greater than previous _factoryId, and of the same assetType.
    *
    * @param _factoryId - uint24 which contains 3 uint8s representing (epoch, cryptoSystem, assetType)
    */
    function upgradeNoteRegistry(uint24 _factoryId) external;

    /**
    * @dev Update the state of the note registry according to transfer instructions issued by a
    * zero-knowledge proof. This method will verify that the relevant proof has been validated,
    * make sure the same proof has can't be re-used, and it then delegates to the relevant noteRegistry.
    *
    * @param _proof - unique identifier for a proof
    * @param _proofOutput - transfer instructions issued by a zero-knowledge proof
    * @param _proofSender - address of the entity sending the proof
    */
    function updateNoteRegistry(
        uint24 _proof,
        bytes calldata _proofOutput,
        address _proofSender
    ) external;


    event SetCommonReferenceString(bytes32[6] _commonReferenceString);
    
    event SetProof(
        uint8 indexed epoch,
        uint8 indexed category,
        uint8 indexed id,
        address validatorAddress
    );

    event IncrementLatestEpoch(uint8 newLatestEpoch);

    event SetFactory(
        uint8 indexed epoch,
        uint8 indexed cryptoSystem,
        uint8 indexed assetType,
        address factoryAddress
    );

    event CreateNoteRegistry(
        address registryOwner,
        address registryAddress,
        uint256 scalingFactor,
        address linkedTokenAddress,
        bool canAdjustSupply,
        bool canConvert
    );

    event UpgradeNoteRegistry(
        address registryOwner,
        address proxyAddress,
        address newBehaviourAddress
    );
    
    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}

