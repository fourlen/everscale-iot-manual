const { TonClient } = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");

const fs = require('fs');
const path = require('path');
const keysFile = path.join(__dirname, 'keys.json');

async function main(client) {
    try {
      const oldKeys = JSON.parse(fs.readFileSync(keysFile, "utf8"));
      console.log('Previous value:', oldKeys.public, oldKeys.secret)
      console.log('Saved to ' + keysFile + '.backup')
      fs.writeFileSync(keysFile + '.backup', JSON.stringify(oldKeys), "utf8")
    }
    catch {}
    const keys = await client.crypto.generate_random_sign_keys();
    fs.writeFileSync(keysFile, JSON.stringify(keys), "utf8")
    console.log('New keys generated and saved to ./keys.json')
}

(async () => {
    try {
        TonClient.useBinaryLibrary(libNode);
        await main(TonClient.default);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
