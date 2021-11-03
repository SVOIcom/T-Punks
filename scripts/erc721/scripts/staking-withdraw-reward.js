const initializeLocklift = require('../../utils/initializeLocklift');
const configuration = require('../../scripts.conf');
const { loadContractData } = require('../../utils/migration/manageContractData');
const { Staking } = require('../modules/staking');
const { ERC721, extendContractToERC721 } = require('../modules/extendContractToERC721');
const { convertCrystal } = require('locklift/locklift/utils');
const { operationFlags } = require('../../utils/transferFlags');
const { MsigWallet, extendContractToWallet } = require('../../wallet/modules/walletWrapper')

async function main() {

    let locklift = await initializeLocklift(configuration.pathToLockliftConfig, configuration.network);
    let staking = new Staking(await loadContractData(locklift, configuration, `${configuration.network}_Staking.json`));
    /**
     * @type {MsigWallet}
     */
    let msigWallet = await loadContractData(locklift, configuration, `${configuration.network}_MsigWallet.json`);
    msigWallet = extendContractToWallet(msigWallet);

    /**
     * @type {ERC721}
     */
    let ercContract = await loadContractData(locklift, configuration, `${configuration.network}_ERC721.json`);
    ercContract = extendContractToERC721(ercContract);
    
    let payload = await staking.withdrawUserReward({
        poolId: 2,
        userTip3Wallet: '0:b199ce052b6c877ad80d4af1e4d649885ec946de599677a8a11b0e2d8bf72df4'
    });

    await msigWallet.transfer({
        destination: staking.address,
        value: convertCrystal(3, 'nano'),
        flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
        bounce: true,
        payload: payload
    });
}

main().then(
    () => process.exit()
).catch(
    (err) => {
        console.log(err);
    }
)