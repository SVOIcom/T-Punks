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
    
    let poolIdPayload = await staking.createPoolPayload({
        poolId: 1
    });

    let payload = await ercContract.transferNFTToContract({
        contractAddress: staking.address,
        punkId: 1210,
        payload: poolIdPayload
    });

    await msigWallet.transfer({
        destination: ercContract.address,
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