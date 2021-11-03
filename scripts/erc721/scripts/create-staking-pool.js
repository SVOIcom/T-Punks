const initializeLocklift = require('../../utils/initializeLocklift');
const configuration = require('../../scripts.conf');
const { loadContractData } = require('../../utils/migration/manageContractData');
const { Staking } = require('../modules/staking');
const { ERC721 } = require('../modules/extendContractToERC721');
const { convertCrystal } = require('locklift/locklift/utils');
const { operationFlags } = require('../../utils/transferFlags');
const { MsigWallet, extendContractToWallet } = require('../../wallet/modules/walletWrapper')

stakingPoolConfig = {
    poolId: 2,
    _rewardTIP3Root: '0:4c5e140ec14fbbd394232568af191b756970bf36b30600e397b30b3e70b0b7b5',
    _totalReward: 1e13,
    _startTime: 1635961581,
    _finishTime: 1635965181,
    _vestingStart: 1635961581,
    _timeToFinishWithdrawProcess: 1635968781
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