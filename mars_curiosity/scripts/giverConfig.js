const { abiContract } = require("@tonclient/core");

const giverAddress = '0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5';
// Giver ABI on TON OS SE
const giverAbi = abiContract({
    'ABI version': 2,
    header: ['time', 'expire'],
    functions: [
        {
            name: 'sendTransaction',
            inputs: [
                { 'name': 'dest', 'type': 'address' },
                { 'name': 'value', 'type': 'uint128' },
                { 'name': 'bounce', 'type': 'bool' }
            ],
            outputs: []
        },
        {
            name: 'getMessages',
            inputs: [],
            outputs: [
                {
                    components: [
                        { name: 'hash', type: 'uint256' },
                        { name: 'expireAt', type: 'uint64' }
                    ],
                    name: 'messages',
                    type: 'tuple[]'
                }
            ]
        },
        {
            name: 'upgrade',
            inputs: [
                { name: 'newcode', type: 'cell' }
            ],
            outputs: []
        },
        {
            name: 'constructor',
            inputs: [],
            outputs: []
        }
    ],
    data: [],
    events: []
});

var giverKeyPair;
try {
    const fs = require('fs');
    const path = require('path');
    const keysFile = path.join(__dirname, 'giverKeys.json');
    giverKeyPair = JSON.parse(fs.readFileSync(keysFile, "utf8"));
    console.log('Using specified giver keys...')
}
catch(err) {
  console.log('Using default giver keys...') // TON OS SE giver keys
  giverKeyPair = {
    "public": "2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16",
    "secret": "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3"
  }
}

async function get_tokens_from_giver(client, account, value) {
    const params = {
        send_events: false,
        message_encode_params: {
            address: giverAddress,
            abi: giverAbi,
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest: account,
                    value: Math.floor(value * 1e9),
                    bounce: false
                }
            },
            signer: {
                type: 'Keys',
                keys: giverKeyPair
            },
        },
    }
    await client.processing.process_message(params)
}

module.exports = { get_tokens_from_giver };
