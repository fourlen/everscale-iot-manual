const { TonClient, signerKeys} = require("@tonclient/core");
const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");

const fs = require('fs');
const path = require('path');
const keysFile = path.join(__dirname, 'keys.json');

const config = require('./config');

const { get_tokens_from_giver } = require('./giverConfig.js')

const { SimpleWalletContract } = require('../artifacts/SimpleWalletContract.js')


async function main(client, cnt) {
    const keys = JSON.parse(fs.readFileSync(keysFile, "utf8"));

    for (var i = 0; i < cnt; i++) {
      console.log(`Initializing simple wallet...`)
      const simpleWallet = new Account(SimpleWalletContract, {signer: signerKeys(keys), client: client, initData: {nonce: i} });
      await get_tokens_from_giver(client, await simpleWallet.getAddress(), 1000)
      await simpleWallet.deploy();
      console.log(`Succeed. Address: ${await simpleWallet.getAddress()}, balance: ${parseInt(await simpleWallet.getBalance()) / 1e9}`)
    }

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
        var cnt = 1;
        if (process.argv.length == 3) {
            cnt = parseInt(process.argv[2])
        }
        await main(client, cnt);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
