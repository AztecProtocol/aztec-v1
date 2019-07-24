pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../../interfaces/IAZTEC.sol";
import "../../libs/NoteUtils.sol";
import "../../libs/VersioningUtils.sol";
import "./interfaces/Behaviour.sol";
import "./interfaces/Factory.sol";
import "./proxies/AdminUpgradeabilityProxy.sol";

/**
 * @title NoteRegistryManager contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev The NoteRegistry defines the state of valid AZTEC notes. It enacts instructions to update the
 * state, given to it by the ACE and only the note registry owner can enact a state update.
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract NoteRegistryManager is IAZTEC, Ownable {
    using SafeMath for uint256;
    using VersioningUtils for uint24;

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

    // Every user has their own note registry
    mapping(address => NoteRegistryBehaviour) public registries;
    mapping(address => IERC20) internal publicTokens;
    mapping(address => uint24) internal registryFactories;
    address[0x100][0x100][0x10000] factories;
    address[0x100][0x100][0x10000] disabledFactories;

    uint8 public latestRegistryEpoch = 1;
    uint8 public defaultCryptoSystem = 1;

    mapping(bytes32 => bool) public validatedProofs;

    modifier onlyRegistry() {
        require(registryFactories[msg.sender] != uint24(0), "method can only be called from a noteRegistry");
        _;
    }

    function incrementLatestRegistryEpoch() public onlyOwner {
        latestRegistryEpoch = latestRegistryEpoch + 1;
    }

    function setDefaultCryptoSystem(uint8 _defaultCryptoSystem) public onlyOwner {
        defaultCryptoSystem = _defaultCryptoSystem;
    }

    /**
    * @dev Register a new Factory
    */
    function setFactory(uint24 _factoryId, address _factoryAddress) public onlyOwner {
        require(_factoryAddress != address(0x0), "expected the factory contract to exist");
        (uint8 epoch, uint8 cryptoSystem, uint8 assetType) = _factoryId.getVersionComponents();
        require(epoch <= latestRegistryEpoch, "the factory epoch cannot be bigger than the latest epoch");
        require(factories[epoch][cryptoSystem][assetType] == address(0x0), "existing factories cannot be modified");
        factories[epoch][cryptoSystem][assetType] = _factoryAddress;
        emit SetFactory(epoch, cryptoSystem, assetType, _factoryAddress);
    }

    function getFactoryAddress(uint24 _factoryId) public view returns (address factoryAddress) {
        bool isFactoryDisabled;
        bool queryInvalid;
        assembly {
            // To compute the storage key for factoryAddress[epoch][cryptoSystem][assetType], we do the following:
            // 1. get the factoryAddress slot
            // 2. add (epoch * 0x10000) to the slot
            // 3. add (cryptoSystem * 0x100) to the slot
            // 4. add (assetType) to the slot
            // i.e. the range of storage pointers allocated to factoryAddress ranges from
            // factoryAddress_slot to (0xffff * 0x10000 + 0xff * 0x100 + 0xff = factoryAddress_slot 0xffffffff)

            // Conveniently, the multiplications we have to perform on epoch, cryptoSystem and assetType correspond
            // to their byte positions in _factoryId.
            // i.e. (epoch * 0x10000) = and(_factoryId, 0xffff0000)
            // and  (cryptoSystem * 0x100) = and(_factoryId, 0xff00)
            // and  (assetType) = and(_factoryId, 0xff)

            // Putting this all together. The storage slot offset from '_factoryId' is...
            // (_factoryId & 0xffff0000) + (_factoryId & 0xff00) + (_factoryId & 0xff)
            // i.e. the storage slot offset IS the value of _factoryId
            factoryAddress := sload(add(_factoryId, factories_slot))

            isFactoryDisabled :=
                shr(
                    shl(0x03, and(_factoryId, 0x1f)),
                    sload(add(shr(5, _factoryId), disabledFactories_slot))
                )
            queryInvalid := or(iszero(factoryAddress), isFactoryDisabled)
        }

        // wrap both require checks in a single if test. This means the happy path only has 1 conditional jump
        if (queryInvalid) {
            require(factoryAddress != address(0x0), "expected the factory address to exist");
            require(isFactoryDisabled == false, "expected the factory address to not be disabled");
        }
    }

    /**
    * @dev Call transferFrom on a linked ERC20 token. Used in cases where the ACE's mint
    * function is called but the token balance of the note registry in question is
    * insufficient
    *
    * @param _value the value to be transferred
    */
    function supplementTokens(uint256 _value) external {
        NoteRegistryBehaviour registry = registries[msg.sender];
        require(address(registry) != address(0x0), "note registry does not exist");
        (
            address linkedToken,
            uint256 scalingFactor,
            ,,,
            bool canConvert,
            bool canAdjustSupply
        ) = registry.getRegistry();
        require(canConvert == true, "note registry does not have conversion rights");
        require(canAdjustSupply == true, "note registry does not have mint and burn rights");
        IERC20(linkedToken).transferFrom(msg.sender, address(this), _value.mul(scalingFactor));
        registry.supplementTokens(_value);
    }

    /**
    * @dev Query the ACE for a previously validated proof
    * @notice This is a virtual function, that must be overwritten by the contract that inherits from NoteRegistr
    *
    * @param _proof - unique identifier for the proof in question and being validated
    * @param _proofHash - keccak256 hash of a bytes proofOutput argument. Used to identify the proof in question
    * @param _sender - address of the entity that originally validated the proof
    * @return boolean - true if the proof has previously been validated, false if not
    */
    function validateProofByHash(uint24 _proof, bytes32 _proofHash, address _sender) public view returns (bool);

    function createNoteRegistry(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public {
        uint8 assetType = getAssetTypeFromFlags(_canConvert, _canAdjustSupply);

        uint24 factoryId = computeVersionFromComponents(latestRegistryEpoch, defaultCryptoSystem, assetType);

        createNoteRegistry(
            _linkedTokenAddress,
            _scalingFactor,
            _canAdjustSupply,
            _canConvert,
            factoryId
        );
    }

    function createNoteRegistry(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert,
        uint24 _factoryId
    ) public {
        require(address(registries[msg.sender]) == address(0x0), "address already has a linked note registry");
        (,, uint8 assetType) = _factoryId.getVersionComponents();
        // assetType is 0b00 where the bits represent (canAdjust, canConvert),
        // so assetType can be one of 1, 2, 3 where
        // 0 == no convert/no adjust (invalid)
        // 1 == can convert/no adjust
        // 2 == no convert/can adjust
        // 3 == can convert/can adjust
        uint8 flagAssetType = getAssetTypeFromFlags(_canConvert, _canAdjustSupply);
        require (flagAssetType != uint8(0), "can not create asset with convert and adjust flags set to false");
        require (flagAssetType == assetType, "expected note registry to match flags");

        address factory = getFactoryAddress(_factoryId);

        address behaviourAddress = NoteRegistryFactory(factory).deployNewBehaviourInstance();

        bytes memory behaviourInitialisation = abi.encodeWithSignature(
            "initialise(address,address,uint256,bool,bool)",
            address(this),
            _linkedTokenAddress,
            _scalingFactor,
            _canAdjustSupply,
            _canConvert
        );
        address proxy = address(new AdminUpgradeabilityProxy(
            behaviourAddress,
            factory,
            behaviourInitialisation
        ));

        registries[msg.sender] = NoteRegistryBehaviour(proxy);
        if (_canConvert) {
            require(_linkedTokenAddress != address(0x0), "expected the linked token address to exist");
            publicTokens[proxy] = IERC20(_linkedTokenAddress);
        }
        registryFactories[proxy] = _factoryId;
        emit CreateNoteRegistry(
            msg.sender,
            proxy,
            _scalingFactor,
            _linkedTokenAddress,
            _canAdjustSupply,
            _canConvert
        );
    }

    function upgradeNoteRegistry(
        uint24 _factoryId
    ) public {
        NoteRegistryBehaviour registry = registries[msg.sender];
        require(address(registry) != address(0x0), "note registry for sender doesn't exist");
    
        (uint8 epoch,, uint8 assetType) = _factoryId.getVersionComponents();
        uint24 oldFactoryId = registryFactories[address(registry)];
        (uint8 oldEpoch,, uint8 oldAssetType) = oldFactoryId.getVersionComponents();
        require(epoch >= oldEpoch, "expected new registry to be of epoch equal or greater than existing registry");
        require(assetType == oldAssetType, "expected assetType to be the same for old and new registry");

        address factory = getFactoryAddress(_factoryId);
        address newBehaviour = NoteRegistryFactory(factory).deployNewBehaviourInstance();

        address oldFactory = getFactoryAddress(oldFactoryId);
        NoteRegistryFactory(oldFactory).upgradeBehaviour(address(registry), newBehaviour);
        registries[msg.sender] = NoteRegistryBehaviour(newBehaviour);
        registryFactories[address(registry)] = _factoryId;
    }

    function transferFrom(address from, address to, uint256 value)
        public
        onlyRegistry
    {
        if (from == address(this)) {
            publicTokens[msg.sender].transfer(to, value);
        } else {
            publicTokens[msg.sender].transferFrom(from, to, value);
        }
    }

    /**
    * @dev Update the state of the note registry according to transfer instructions issued by a
    * zero-knowledge proof
    *
    * @param _proof - unique identifier for a proof
    * @param _proofOutput - transfer instructions issued by a zero-knowledge proof
    * @param _proofSender - address of the entity sending the proof
    */
    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput,
        address _proofSender
    ) public {
        NoteRegistryBehaviour registry = registries[msg.sender];
        require(address(registry) != address(0x0), "note registry does not exist");
        bytes32 proofHash = keccak256(_proofOutput);
        require(
            validateProofByHash(_proof, proofHash, _proofSender) == true,
            "ACE has not validated a matching proof"
        );
        // clear record of valid proof - stops re-entrancy attacks and saves some gas
        validatedProofs[proofHash] = false;

        registry.updateNoteRegistry(_proof, _proofOutput);
    }

    /**
    * @dev This should be called from an asset contract.
    */
    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) public {
        NoteRegistryBehaviour registry = registries[_registryOwner];
        require(address(registry) != address(0x0), "note registry does not exist");
        registry.publicApprove(msg.sender, _proofHash, _value);
    }

    /**
     * @dev Returns the registry for a given address.
     *
     * @param _owner - address of the registry owner in question
     * @return linkedTokenAddress - public ERC20 token that is linked to the NoteRegistry. This is used to
     * transfer public value into and out of the system
     * @return scalingFactor - defines how many ERC20 tokens are represented by one AZTEC note
     * @return totalSupply - TODO
     * @return confidentialTotalMinted - keccak256 hash of the note representing the total minted supply
     * @return confidentialTotalBurned - keccak256 hash of the note representing the total burned supply
     * @return canConvert - flag set by the owner to decide whether the registry has public to private, and
     * vice versa, conversion privilege
     * @return canAdjustSupply - determines whether the registry has minting and burning privileges
     */
    function getRegistry(address _owner) public view returns (
        address linkedToken,
        uint256 scalingFactor,
        uint256 totalSupply,
        bytes32 confidentialTotalMinted,
        bytes32 confidentialTotalBurned,
        bool canConvert,
        bool canAdjustSupply
    ) {
        NoteRegistryBehaviour registry = registries[_owner];
        return registry.getRegistry();
    }

    /**
     * @dev Returns the note for a given address and note hash.
     *
     * @param _registryOwner - address of the registry owner
     * @param _noteHash - keccak256 hash of the note coordiantes (gamma and sigma)
     * @return status - status of the note, details whether the note is in a note registry
     * or has been destroyed
     * @return createdOn - time the note was created
     * @return destroyedOn - time the note was destroyed
     * @return noteOwner - address of the note owner
     */
    function getNote(address _registryOwner, bytes32 _noteHash) public view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    ) {
        NoteRegistryBehaviour registry = registries[_registryOwner];
        return registry.getNote(_noteHash);
    }

    function getAssetTypeFromFlags(bool canConvert, bool canAdjust) internal pure returns (uint8 assetType) {
        uint8 convert = canConvert ? 1 : 0;
        uint8 adjust = canAdjust ? 2 : 0;

        assetType = convert + adjust;
    }

    function computeVersionFromComponents(uint8 first, uint8 second, uint8 third) internal pure returns (uint24 version) {
        assembly {
            version := or(mul(first, 0x10000), or(mul(second, 0x100), third))
        }
    }
}
