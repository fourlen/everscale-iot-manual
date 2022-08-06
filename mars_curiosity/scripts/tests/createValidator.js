const { TonClient, signerKeys} = require("@tonclient/core");
const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");

const fs = require('fs');
const path = require('path');
const keysFile = path.join(__dirname, '../keys.json');

const config = require('../config');

const { get_tokens_from_giver } = require('../giverConfig.js')

const { constructContracts, getLighthouseAddress } = require('../common.js')

const { MultiValidatorExampleContract } = require('../../artifacts/MultiValidatorExampleContract.js')


async function main(client) {
    const keys = JSON.parse(fs.readFileSync(keysFile, "utf8"));
    const { root, xrt } = await constructContracts(client, keys)

    const validator = new Account(MultiValidatorExampleContract,
      {signer: signerKeys(keys), client: client,
       initData: {
           lighthouse: await getLighthouseAddress(client, root, xrt, 'Lighthouse'),
           k: 2,
           pubkeys: {
              1: '0x' + keys.public,
              2: '0x' + keys.public,
              3: '0x' + keys.public
           }
       }
    });
    await get_tokens_from_giver(client, await validator.getAddress(), 5)

    console.log(await validator.getAddress());
    await validator.deploy();
}

(async () => {
    try {
        TonClient.useBinaryLibrary(libNode);
        const client = new TonClient({
            network: {
                endpoints: config['network']['endpoints'],
            }
        });
        console.log("Hello TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
