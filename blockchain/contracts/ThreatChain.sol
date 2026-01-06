// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title ThreatChain
 * @dev Immutable threat logging system for Sentinel MLaaS Security Platform
 * @notice Stores cryptographic hashes of detected threats for tamper-proof auditing
 */
contract ThreatChain {
    
    // Threat severity levels
    enum Severity { LOW, MEDIUM, HIGH, CRITICAL }
    
    /**
     * @dev Structure representing a threat record
     * @param threatId Unique identifier from backend
     * @param threatHash SHA-256 hash of complete threat details
     * @param timestamp Block timestamp when threat was logged
     * @param ipAddressHash Hashed IP address for privacy
     * @param severity Threat severity level (0-3)
     * @param blockNumber Block number where threat was recorded
     */
    struct ThreatRecord {
        string threatId;
        bytes32 threatHash;
        uint256 timestamp;
        bytes32 ipAddressHash;
        Severity severity;
        uint256 blockNumber;
    }
    
    // Array storing all threat records (immutable log)
    ThreatRecord[] private threats;
    
    // Mapping for O(1) lookup: threatId => array index
    mapping(string => uint256) private threatIdToIndex;
    
    // Mapping to check if threatId already exists
    mapping(string => bool) private threatExists;
    
    // Contract owner (can be used for future access control)
    address public owner;
    
    /**
     * @dev Event emitted when a new threat is logged
     * @param threatId Unique threat identifier
     * @param threatHash Cryptographic hash of threat data
     * @param timestamp When threat was detected
     * @param severity Threat severity level
     * @param blockNumber Block where threat was stored
     */
    event ThreatLogged(
        string indexed threatId,
        bytes32 threatHash,
        uint256 timestamp,
        Severity severity,
        uint256 blockNumber
    );
    
    /**
     * @dev Constructor sets contract deployer as owner
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Logs a new threat to the blockchain
     * @param _threatId Unique identifier from backend
     * @param _threatHash SHA-256 hash of threat details
     * @param _ipAddress IP address of attacker (will be hashed)
     * @param _severity Threat severity (0=LOW, 1=MEDIUM, 2=HIGH, 3=CRITICAL)
     * @return index The array index where threat was stored
     * 
     * Requirements:
     * - threatId must not already exist
     * - threatHash must not be zero
     */
    function logThreat(
        string memory _threatId,
        bytes32 _threatHash,
        string memory _ipAddress,
        Severity _severity
    ) public returns (uint256) {
        require(!threatExists[_threatId], "Threat ID already logged");
        require(_threatHash != bytes32(0), "Invalid threat hash");
        require(bytes(_threatId).length > 0, "Threat ID cannot be empty");
        
        // Hash IP address for privacy compliance
        bytes32 ipHash = keccak256(abi.encodePacked(_ipAddress));
        
        // Create threat record
        ThreatRecord memory newThreat = ThreatRecord({
            threatId: _threatId,
            threatHash: _threatHash,
            timestamp: block.timestamp,
            ipAddressHash: ipHash,
            severity: _severity,
            blockNumber: block.number
        });
        
        // Store in array
        threats.push(newThreat);
        uint256 index = threats.length - 1;
        
        // Update mappings
        threatIdToIndex[_threatId] = index;
        threatExists[_threatId] = true;
        
        // Emit event for off-chain monitoring
        emit ThreatLogged(
            _threatId,
            _threatHash,
            block.timestamp,
            _severity,
            block.number
        );
        
        return index;
    }
    
    /**
     * @dev Returns the total number of threats logged
     * @return count Total threat records stored
     */
    function getThreatCount() public view returns (uint256) {
        return threats.length;
    }
    
    /**
     * @dev Retrieves a specific threat by array index
     * @param _index Array index of the threat
     * @return Threat record at specified index
     */
    function getThreat(uint256 _index) public view returns (ThreatRecord memory) {
        require(_index < threats.length, "Index out of bounds");
        return threats[_index];
    }
    
    /**
     * @dev Retrieves a threat by its unique ID
     * @param _threatId Unique threat identifier
     * @return Threat record with matching ID
     */
    function getThreatById(string memory _threatId) public view returns (ThreatRecord memory) {
        require(threatExists[_threatId], "Threat ID not found");
        uint256 index = threatIdToIndex[_threatId];
        return threats[index];
    }
    
    /**
     * @dev Returns all threat records (use with caution - gas intensive)
     * @return Array of all threat records
     * @notice For large datasets, use pagination via getThreat() with index range
     */
    function getAllThreats() public view returns (ThreatRecord[] memory) {
        return threats;
    }
    
    /**
     * @dev Returns paginated threat records
     * @param _startIndex Starting index (inclusive)
     * @param _endIndex Ending index (exclusive)
     * @return Slice of threat records
     */
    function getThreatsRange(uint256 _startIndex, uint256 _endIndex) 
        public 
        view 
        returns (ThreatRecord[] memory) 
    {
        require(_startIndex < _endIndex, "Invalid range");
        require(_endIndex <= threats.length, "End index out of bounds");
        
        uint256 rangeSize = _endIndex - _startIndex;
        ThreatRecord[] memory result = new ThreatRecord[](rangeSize);
        
        for (uint256 i = 0; i < rangeSize; i++) {
            result[i] = threats[_startIndex + i];
        }
        
        return result;
    }
    
    /**
     * @dev Checks if a threat ID has been logged
     * @param _threatId Threat identifier to check
     * @return True if threat exists, false otherwise
     */
    function isThreatLogged(string memory _threatId) public view returns (bool) {
        return threatExists[_threatId];
    }
}