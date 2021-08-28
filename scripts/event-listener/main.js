const { Sequelize } = require("sequelize");
const configuration = require("../scripts.conf");
const initializeLocklift = require("../utils/initializeLocklift");
const { loadContractData } = require("../utils/migration/manageContractData");
const { config } = require("./db.conf");
const { PunkEvents } = require("./modules/db");

async function main() {
    let locklift = await initializeLocklift(configuration.pathToLockliftConfig, configuration.network);
    let sequelize = new Sequelize(config.db.DB, config.db.USER, config.db.PASSWORD, {
        host: config.db.HOST,
        dialect: config.db.dialect,
        pool: config.db.pool,
        storage: config.db.storage
    });

    let ercContract = await loadContractData(locklift, configuration, `${configuration.network}_ERC721.json`);

    await PunkEvents.initializeDB(sequelize);

    let lastUpdateTime = 1630168822;

    while (true) {
        if (lastUpdateTime < Math.floor(Date.now() / 1000)) {
            let messages = await locklift.ton.client.net.query_collection({
                collection: 'messages',
                filter: {
                    src: { eq: ercContract.address },
                    msg_type: { eq: 2 },
                    created_at: { ge: lastUpdateTime - config.net.timeDelta, lt: lastUpdateTime }
                },
                order: [{
                    path: 'created_at',
                    direction: 'DESC'
                }],
                result: 'body created_at'
            });

            console.log(`${lastUpdateTime - config.net.timeDelta} - ${lastUpdateTime}: ${messages.result.length}`);

            if (messages.result.length > 0) {
                for (let message of messages.result) {
                    try {
                        let decodedMessage = await locklift.ton.client.abi.decode_message_body({
                            body: message.body,
                            is_internal: true,
                            abi: {
                                type: 'Contract',
                                value: ercContract.abi
                            }
                        });

                        if (decodedMessage.body_type == 'Event') {
                            decodedMessage.value.name = decodedMessage.name;
                            await PunkEvents.addEventToDB(decodedMessage.value);
                        }
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
            lastUpdateTime += config.net.timeDelta;
        }
    }
}

main().then(
    () => process.exit(0)
).catch(
    (err) => {
        console.log(err);
        process.exit(1);
    }
)