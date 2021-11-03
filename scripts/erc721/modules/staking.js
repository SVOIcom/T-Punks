const Contract = require('locklift/locklift/contract');
const { encodeMessageBody } = require('../../utils/utils');

class ContractTemplate extends Contract {
    /**
     * 
     * @param {Contract} contract 
     */
    constructor(contract) {
        super({
            locklift: contract.locklift,
            abi: contract.abi,
            base64: contract.base64,
            code: contract.code,
            name: contract.name,
            address: contract.address,
            keyPair: contract.keyPair,
            autoAnswerIdOnCall: contract.autoAnswerIdOnCall,
            autoRandomNonce: contract.autoRandomNonce,
            afterRun: contract.afterRun
        });
    }
}

class Staking extends ContractTemplate {
    async upgradeContractCode({code, updateParams, codeVersion_}) {
        return await encodeMessageBody({
            contract: this,
            functionName: 'upgradeContractCode',
            input: {
                code,
                updateParams,
                codeVersion_
            }
        })
    }

    async setNftAddress({_nft}) {
        return await encodeMessageBody({
            contract: this,
            functionName: 'setNFTAddress',
            input: {
                _nft
            }
        })
    }

    async transferOwnershitp({_newOwner}) {
        return await encodeMessageBody({
            contract: this,
            functionName: 'transferOwnership',
            input: {
                _newOwner
            }
        })
    }

    async addPool({
        poolId,
        _rewardTIP3Root,
        _totalReward,
        _startTime,
        _finishTime,
        _timeToFinishWithdrawProcess,
        _vestingStart
    }) {
        return await encodeMessageBody({
            contract: this,
            functionName: 'addPool',
            input: {
                poolId,
                _vestingStart,
                _rewardTIP3Root,
                _totalReward,
                _startTime,
                _finishTime,
                _timeToFinishWithdrawProcess
            }
        })
    }

    async uploadRankingInfo({_rankings}) {
        return await encodeMessageBody({
            contract: this, 
            functionName: 'uploadRankingInfo',
            input: {
                _rankings
            }
        })
    }

    async withdrawFromStaking({poolId, punkId}) {
        return await encodeMessageBody({
            contract: this,
            functionName: 'withdrawFromStaking',
            input: {
                poolId,
                punkId
            }
        })
    }

    async updateUserReward({poolId}) {
        return await encodeMessageBody({
            contract: this,
            functionName: 'updateUserReward',
            input: {
                poolId
            }
        })
    }

    async withdrawUserReward({poolId, userTip3Wallet}) {
        return await encodeMessageBody({
            contract: this,
            functionName: 'withdrawUserReward',
            input: {
                poolId,
                userTip3Wallet
            }
        })
    }

    async getUserReward({_user, _poolId}) {
        return await this.call({
            method: 'getUserReward',
            params: {
                _user,
                _poolId
            },
            keyPair: this.keyPair
        })
    }

    async createPoolPayload({poolId}) {
        return await this.call({
            method: 'createPoolPayload',
            params: {
                poolId
            },
            keyPair: this.keyPair
        })
    }

    async ownerInfo() {
        return await this.call({
            method: 'ownerInfo',
            params: {},
            keyPair: this.keyPair
        })
    }

    async pools() {
        return await this.call({
            method: 'pools',
            params: {},
            keyPair: this.keyPair
        })
    }

    async knownTIP3Pools() {
        return await this.call({
            method: 'knownTIP3Pools',
            params: {},
            keyPair: this.keyPair
        })
    }

    async rankings() {
        return await this.call({
            method: 'rankings',
            params: {},
            keyPair: this.keyPair
        })
    }
}

module.exports = {
    Staking
}