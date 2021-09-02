const Contract = require('locklift/locklift/contract');
const { encodeMessageBody } = require('../../utils/utils');

class ERC721 extends Contract {
    async uploadToken({ punkInfo }) {}

    async startSell() {}

    async getOwnerOf({ tokenID }) {}

    async mintToken({ referal }) {}

    async transferTokenTo({ tokenID, receiver }) {}

    async getAllNfts() {}

    async getUserNfts({ collector }) {}

    async getNft({ nftID }) {}

    async getTokenSupplyInfo() {}

    async getTokenPrice() {}

    async setBuyPrice({ priceForSale_ }) {}

    async withdrawExtraTons({ tonsToWithdraw }) {}

    async setForSale({ tokenID, tokenPrice }) {}

    async setAsNotForSale({ tokenID }) {}

    async buyToken({ tokenID }) {}

    async getAllTokensForSale() {}

    async getSellInfo({ tokenID }) {}

    async upgradeContractCode({ code, updateParams, codeVersion_ }) {}
}


/**
 * 
 * @param {Contract} contract 
 * @returns {ERC721}
 */
function extendContractToERC721(contract) {
    contract.uploadToken = async function({ tokenID, punkInfo }) {
        return await encodeMessageBody({
            contract: contract,
            functionName: 'uploadToken',
            input: {
                punkInfo
            }
        });
    }

    contract.startSell = async function() {
        return await encodeMessageBody({
            contract: contract,
            functionName: 'startSell',
            input: {}
        });
    }

    contract.getOwnerOf = async function({ tokenID }) {
        return await contract.call({
            method: 'getOwnerOf',
            params: {
                tokenID
            },
            keyPair: contract.keyPair
        });
    }

    contract.mintToken = async function({ referal }) {
        return await encodeMessageBody({
            contract: contract,
            functionName: 'mintToken',
            input: {
                referal
            }
        });
    }

    contract.transferTokenTo = async function({ tokenID, receiver }) {
        return await encodeMessageBody({
            contract: contract,
            functionName: 'transferTokenTo',
            input: {
                tokenID,
                receiver
            }
        });
    }

    contract.getAllNfts = async function() {
        return await contract.call({
            method: 'getAllNfts',
            params: {},
            keyPair: contract.keyPair
        });
    }

    contract.getUserNfts = async function({ collector }) {
        return await contract.call({
            method: 'getUserNfts',
            params: {
                collector
            },
            keyPair: contract.keyPair
        });
    }

    contract.getNft = async function({ nftID }) {
        return await contract.call({
            method: 'getNft',
            params: {
                nftID
            },
            keyPair: contract.keyPair
        });
    }

    contract.getTokenSupplyInfo = async function() {
        return await contract.call({
            method: 'getTokenSupplyInfo',
            params: {},
            keyPair: contract.keyPair
        });
    }

    contract.getTokenPrice = async function() {
        return await contract.call({
            method: 'getTokenPrice',
            params: {},
            keyPair: contract.keyPair
        });
    }

    contract.setBuyPrice = async function({ priceForSale_ }) {
        return await encodeMessageBody({
            contract: contract,
            functionName: 'setBuyPrice',
            input: {
                priceForSale_
            }
        });
    }

    contract.withdrawExtraTons = async function({ tonsToWithdraw }) {
        return await encodeMessageBody({
            contract: contract,
            functionName: 'withdrawExtraTons',
            input: {
                tonsToWithdraw
            }
        });
    }

    contract.setForSale = async function({ tokenID, tokenPrice }) {
        return await encodeMessageBody({
            contract: contract,
            functionName: 'setForSale',
            input: {
                tokenID,
                tokenPrice
            }
        });
    }

    contract.setAsNotForSale = async function({ tokenID }) {
        return await encodeMessageBody({
            contract: contract,
            functionName: 'setAsNotForSale',
            input: {
                tokenID
            }
        });
    }

    contract.buyToken = async function({ tokenID }) {
        return await encodeMessageBody({
            contract: contract,
            functionName: 'buyToken',
            input: {
                tokenID
            }
        });
    }

    contract.getAllTokensForSale = async function() {
        return await contract.call({
            method: 'getAllTokensForSale',
            params: {},
            keyPair: contract.keyPair
        });
    }

    contract.getSellInfo = async function({ tokenID }) {
        return await contract.call({
            method: 'getAllTokensForSale',
            params: {
                tokenID
            },
            keyPair: contract.keyPair
        });
    }

    contract.upgradeContractCode = async function({ code, updateParams, codeVersion_ }) {
        return await encodeMessageBody({
            contract: contract,
            functionName: 'upgradeContractCode',
            input: {
                code,
                updateParams,
                codeVersion_
            }
        });
    }
    return contract;
}

module.exports = {
    ERC721,
    extendContractToERC721
}