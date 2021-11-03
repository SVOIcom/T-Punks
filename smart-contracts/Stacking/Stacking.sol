pragma ton-solidity >= 0.47.0;

import '../utils/TIP3/interfaces/ITONTokenWallet.sol';
import '../utils/TIP3/interfaces/IRootTokenContract.sol';

import '../ERC721/interfaces/IERC721_v2.sol';

import '../ERC721/interfaces/IUpgradableContract.sol';

struct PunkStakeInfo {
    uint32 id;
    uint32 rank;
    uint32 poolId;
}

struct UserPoolInfo {
    uint256 stakedTokens;
    uint256 pendingReward;
    uint256 rewardPerTokenSum;
}

struct PoolInfo {
    address rewardTIP3Root;
    address rewardTIP3Wallet;

    uint256 rewardPerTokenSum;
    uint256 totalReward;
    uint256 totalPayout;
    uint256 totalStaked;

    uint64 startTime;
    uint64 finishTime;
    uint64 duration;
    uint64 durationOfRewardWithdrawal;
    uint64 lastRPTSupdate;
}

struct OwnerStructure {
    mapping(uint32 => PunkStakeInfo) punkInfo;
    mapping(uint32 => UserPoolInfo) poolInfo;
}

struct RankStruct {
    uint32 low;
    uint32 high;
}

library ERRORS {
    uint8 constant MSG_SENDER_IS_NOT_OWNER = 101;
    uint8 constant WRONG_POOL_ID = 102;
    uint8 constant NO_REWARD_TO_WITHDRAW = 103;
}

contract Staking is INFTReceiver, IUpgradableContract {

    uint256 constant improvedPrecision = 1e18;

    address public owner;
    address public nft;

    TvmCell empty;
    
    mapping(address => OwnerStructure) public ownerInfo;
    mapping(uint32 => PoolInfo) public pools;

    mapping(address => bool) public knownTIP3Roots;
    mapping(address => uint32) public rootsToPools;

    mapping(uint256 => RankStruct) public rankings;

    constructor(address _owner) public {
        tvm.accept();
        owner = _owner;
    }

    function upgradeContractCode(TvmCell code, TvmCell updateParams, uint32 codeVersion_) external override onlyOwner {
        tvm.rawReserve(msg.value, 2);

        address _owner = owner;
        address _nft = nft;
        TvmCell _empty = empty;

        mapping(address => OwnerStructure) _ownerInfo = ownerInfo;
        mapping(uint32 => PoolInfo) _pools = pools;
        mapping(address => bool) _knownTIP3Roots = knownTIP3Roots;
        mapping(address => uint32) _rootsToPools = rootsToPools;
        mapping(uint256 => RankStruct) _rankings = rankings;

        tvm.setcode(code);
        tvm.setCurrentCode(code);

        onCodeUpgrade(
            _owner,
            _nft,
            _empty,
            _ownerInfo,
            _pools,
            _knownTIP3Roots,
            _rootsToPools,
            _rankings
        );
    }

    function onCodeUpgrade(
        address _owner,
        address _nft,
        TvmCell _empty,
        mapping(address => OwnerStructure) _ownerInfo,
        mapping(uint32 => PoolInfo) _pools,
        mapping(address => bool) _knownTIP3Roots,
        mapping(address => uint32) _rootsToPools,
        mapping(uint256 => RankStruct) _rankings
    ) private {
        tvm.resetStorage();

        owner = _owner;
        nft = _nft;
        empty = _empty;
        ownerInfo = _ownerInfo;
        pools = _pools;
        knownTIP3Roots = _knownTIP3Roots;
        rootsToPools = _rootsToPools;
        rankings = _rankings;
    }

    function setNFTAddress(address _nft) external onlyOwner {
        tvm.rawReserve(msg.value, 2);
        nft = _nft;
        address(msg.sender).transfer({value: 0, flag: 64});
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        tvm.rawReserve(msg.value, 2);
        owner = _newOwner;
        address(msg.sender).transfer({value: 0, flag: 64});
    }

    function addPool(
        uint32 poolId,
        address _rewardTIP3Root,
        uint128 _totalReward,
        uint64 _startTime,
        uint64 _finishTime,
        uint64 _timeToFinishWithdrawProcess
    ) external onlyOwner {
        tvm.rawReserve(msg.value, 2);
        PoolInfo pi = PoolInfo({
            rewardTIP3Root: _rewardTIP3Root,
            rewardTIP3Wallet: address.makeAddrStd(0, 0),

            rewardPerTokenSum: 0,
            totalReward: _totalReward,
            totalPayout: 0,
            totalStaked: 0,

            startTime: _startTime,
            finishTime: _finishTime,
            duration: _finishTime - _startTime,
            durationOfRewardWithdrawal: _timeToFinishWithdrawProcess - _startTime,
            lastRPTSupdate: 0
        });

        pools[poolId] = pi;

        rootsToPools[_rewardTIP3Root] = poolId;
        knownTIP3Roots[_rewardTIP3Root] = true;

        _createTIP3Wallet(_rewardTIP3Root);
    }

    function _createTIP3Wallet(address tip3Root) internal view {
        IRootTokenContract(tip3Root).deployEmptyWallet{
            value: 1 ton
        }({
            deploy_grams: 0.5 ton,
            wallet_public_key: 0,
            owner_address: address(this),
            gas_back_address: owner
        });

        IRootTokenContract(tip3Root).getWalletAddress{
            value: 0.5 ton,
            callback: this.receiveTIP3RewardWalletAddress
        }({
            wallet_public_key: 0,
            owner_address: address(this)
        });
    }

    function receiveTIP3RewardWalletAddress(address rewardTIP3Wallet) external onlyKnownTIP3Root {
        tvm.accept();

        pools[rootsToPools[msg.sender]].rewardTIP3Wallet = rewardTIP3Wallet;

        address(owner).transfer({value: 0, flag: 128});
    }

    function uploadRankingInfo(mapping(uint256 => RankStruct) _rankings) external onlyOwner {
        tvm.rawReserve(msg.value, 2);

        rankings = _rankings;

        address(nft).transfer({value: 0, flag: 128});
    }

    /************************************************************************************* */

    function receiveNFT(address _staker, Punk _punk, TvmCell payload) external override onlyNFT {
        tvm.rawReserve(0, 4);

        TvmSlice ts = payload.toSlice();
        uint32 poolId;
        if (ts.hasNBitsAndRefs(32, 0)) {
            (poolId) = ts.decode(uint32);
            if (pools.exists(poolId)) {
                _depositNFTToPool(_staker, _punk, poolId);
                address(_staker).transfer({ value: 0, flag: 128 });
            } else {
                _transferPunk(_staker, _punk.rank, empty);
            }
        } else {
            _transferPunk(_staker, _punk.rank, empty);
        }
    }

    function _depositNFTToPool(address sender, Punk _punkInfo, uint32 poolId) internal {
        _updateUserReward(sender, poolId);
        PoolInfo pi = pools[poolId];
        uint256 nftValue = _determineNFTValue(_punkInfo.rank);
        pi.totalStaked += nftValue;
        ownerInfo[sender].punkInfo[_punkInfo.id] = PunkStakeInfo(_punkInfo.id, _punkInfo.rank, poolId);
        ownerInfo[sender].poolInfo[poolId].stakedTokens += nftValue;
    }

    function withdrawFromStaking(uint32 poolId, uint32 punkId) external {
        require(
            ownerInfo[msg.sender].punkInfo[punkId].id == punkId, ERRORS.MSG_SENDER_IS_NOT_OWNER
        );
        require(
            ownerInfo[msg.sender].punkInfo[punkId].poolId == poolId, ERRORS.WRONG_POOL_ID
        );
        tvm.rawReserve(0, 4);
        _withdrawNFTFromPool(msg.sender, punkId, poolId);
    }

    function _withdrawNFTFromPool(address sender, uint32 punkId, uint32 poolId) internal {
        _updateUserReward(sender, poolId);
        PoolInfo pi = pools[poolId];
        uint256 nftValue = _determineNFTValue(ownerInfo[sender].punkInfo[punkId].rank);
        pi.totalStaked -= nftValue;
        ownerInfo[sender].poolInfo[poolId].stakedTokens -= nftValue;
        delete ownerInfo[sender].punkInfo[punkId];
        _transferPunk(sender, punkId, empty);
    }

    function updateUserReward(uint32 poolId) external {
        tvm.rawReserve(0, 4);
        _updateUserReward(msg.sender, poolId);
        address(msg.sender).transfer({value: 0, flag: 128});
    }

    function _updateUserReward(address staker, uint32 poolId) internal {
        PoolInfo pi = pools[poolId];
        pi.rewardPerTokenSum += _getPoolDelta(poolId);
        pools[poolId].lastRPTSupdate = uint64(now);

        UserPoolInfo upi = ownerInfo[staker].poolInfo[poolId];
        uint128 userRewardDelta = upi.rewardPerTokenSum == 0 ? 0 : uint128((pi.rewardPerTokenSum - upi.rewardPerTokenSum) * upi.stakedTokens / improvedPrecision);
        upi.rewardPerTokenSum = pi.rewardPerTokenSum;
        upi.pendingReward += userRewardDelta;
        ownerInfo[staker].poolInfo[poolId] = upi;
        pools[poolId] = pi;
    }

    function withdrawUserReward(uint32 poolId, address userTip3Wallet) external {
        require(
            _getPossibleUserReward(msg.sender, poolId) > 0, ERRORS.NO_REWARD_TO_WITHDRAW
        );
        tvm.rawReserve(0, 4);
        _updateUserReward(msg.sender, poolId);
        _withdrawUserReward(msg.sender, poolId, userTip3Wallet);
    }

    function _withdrawUserReward(address _staker, uint32 _poolId, address _tip3Wallet) internal {
        uint128 toTransfer = uint128(_getPossibleUserReward(_staker, _poolId));
        ownerInfo[_staker].poolInfo[_poolId].pendingReward = 0;
        ITONTokenWallet(pools[_poolId].rewardTIP3Wallet).transfer{
            value: 0,
            flag: 128
        }(
            _tip3Wallet,
            toTransfer,
            0,
            address.makeAddrStd(0, 0),
            true,
            empty
        );
    }

    function _transferPunk(address sender, uint32 punkId, TvmCell payload) internal view {
        ITPunksCallbacks(nft).transferNFTFromContract{
            flag: 128
        }(sender, punkId, payload);
    }

    function _determineNFTValue(uint32 rank) internal view returns(uint256) {
        for ((uint256 value, RankStruct rankBounds): rankings) {
            if (
                (rank >= rankBounds.low) &&
                (rank < rankBounds.high)
            ) {
                return value;
            }
        }
        return 0;
    }

    function _getPoolDelta(uint32 poolId) internal view returns (uint256) {
        uint64 time = uint64(now);
        PoolInfo pi = pools[poolId];
        if (time < pi.lastRPTSupdate) {
            uint64 dt = math.min(time, pi.finishTime) - math.max(pi.startTime, pi.lastRPTSupdate);
            uint256 rewardPerToken = improvedPrecision * dt * pi.totalReward / pi.duration / pi.totalStaked;
            return rewardPerToken;
        } else {
            return 0;
        }
    }

    function getUserReward(address _user, uint32 _poolId) external view returns (uint256) {
        return _getPossibleUserReward(_user, _poolId);
    }

    function _getPossibleUserReward(address _staker, uint32 _poolId) internal view returns(uint256) {
        return ownerInfo[_staker].poolInfo[_poolId].pendingReward * (
            math.max(uint64(now), pools[_poolId].startTime + pools[_poolId].durationOfRewardWithdrawal) - pools[_poolId].startTime
        ) / pools[_poolId].durationOfRewardWithdrawal;
    }

    function updateReward(uint32 poolId) external {
        tvm.rawReserve(msg.value, 2);
        _updateUserReward(msg.sender, poolId);
        address(msg.sender).transfer({value: 0, flag: 64});
    }

    function createPoolPayload(uint32 poolId) external returns(TvmCell) {
        TvmBuilder tb;
        tb.store(poolId);
        return tb.toCell();
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 101);
        _;
    }

    modifier onlyNFT() {
        require(msg.sender == nft, 102);
        _;
    }

    modifier onlyKnownTIP3Root() {
        require(knownTIP3Roots.exists(msg.sender), 103);
        _;
    }
}