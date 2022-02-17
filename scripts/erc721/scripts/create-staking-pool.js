const initializeLocklift = require('../../utils/initializeLocklift');
const configuration = require('../../scripts.conf');
const { loadContractData } = require('../../utils/migration/manageContractData');
const { Staking } = require('../modules/staking');
const { ERC721 } = require('../modules/extendContractToERC721');
const { convertCrystal } = require('locklift/locklift/utils');
const { operationFlags } = require('../../utils/transferFlags');
const { MsigWallet, extendContractToWallet } = require('../../wallet/modules/walletWrapper')

stakingPoolConfig = {
    poolId: 1,
    _rewardTIP3Root: '0:967c87a81c2ad6a489fe006f831a11ffd8ac5bc6f7dd4e107a27e0e6a7728144',
    _totalReward: 90000*1e9,
    _startTime: 1636027089,
    _finishTime: 1643975889,
    _vestingStart: 1636027089,
    _timeToFinishWithdrawProcess: 1643975889
}


async function main() {
    let locklift = await initializeLocklift(configuration.pathToLockliftConfig, configuration.network);
    let staking = new Staking(await loadContractData(locklift, configuration, `${configuration.network}_Staking.json`));
    let payload = await staking.addPool(stakingPoolConfig);
    /**
     * @type {MsigWallet}
     */
    let msigWallet = await loadContractData(locklift, configuration, `${configuration.network}_MsigWallet.json`);
    msigWallet = extendContractToWallet(msigWallet)

    await msigWallet.transfer({
        destination: staking.address,
        value: convertCrystal(1, 'nano'),
        flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
        bounce: true,
        payload: payload
    });

    console.log(await staking.pools());
}

main().then(
    () => process.exit()
).catch(
    (err) => {
        console.log(err)
    }
)