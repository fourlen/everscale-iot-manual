const assert = require("assert");

const { TonClient, signerNone, signerKeys, signerExternal, abiContract,
  builderOpInteger, builderOpCell, builderOpCellBoc, builderOpBitString } = require("@tonclient/core");
const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");

const fs = require('fs');
const path = require('path');
const keysFile = path.join(__dirname, '../keys.json');

const { get_tokens_from_giver } = require('../giverConfig.js')

const config = require('../config');

const { LighthouseContract } = require('../../artifacts/LighthouseContract.js');
const { RootContract } = require('../../artifacts/RootContract.js');
const { XRTContract } = require('../../artifacts/XRTContract.js');
const { SimpleWalletContract } = require('../../artifacts/SimpleWalletContract.js');
const { MultiValidatorExampleContract } = require('../../artifacts/MultiValidatorExampleContract.js');

const { constructContracts, getLighthouseAddress } = require('../common.js');

(async () => {
    try {
        TonClient.useBinaryLibrary(libNode);
        const client = new TonClient({
            network: {
                endpoints: config['network']['endpoints'],
            }
        });
        console.log("Hello TON!");


        const keys = JSON.parse(fs.readFileSync(keysFile, "utf8"));
        const { root, xrt } = await constructContracts(client, keys);
        const lighthouse = new Account(LighthouseContract, { address: await getLighthouseAddress(client, root, xrt, 'Lighthouse'), client: client })
        
        
        decoded = await client.abi.decode_boc({
            params: [
                {
                    name: "model",
                    type: "string"
                },
                {
                    name: "objective",
                    type: "string"
                },
                {
                    name: "cost",
                    type: "uint128"
                },
                {
                    name: "token",
                    type: "address"
                },
                {
                    name: "penalty",
                    type: "uint128"
                },
                {
                    name: "validatorContract",
                    type: "optional(address)"
                },
                {
                    name: "validatorPubkey",
                    type: "optional(uint256)"
                }
            ],
            boc: "te6ccgEBBAEAfgADgwAAAAAAAAAAAAAAAAAAAAGAHNmJr2F48gV+1RZ1ecjczAEPZWTAACBPB8+eA50rEqcgAAAAAAAAAAAAAAAAAAAATAMCAQBAHxjp1PYTWZBmOVkpiUd4Pg5z4GLBevKAb6GB6boFlHgADExhdW5jaAAWU3VwZXIgbW9kZWw=",
            allow_partial: true       
        });

        liabilityBoc = (await lighthouse.runLocal('getLiabilityByHash', {
            liabilityHash: "0x60d3c5186ae3125bc810d29462ce18a4a624f9f1c3d869bef015ffa23f04e319"
        })).decoded.output.value0;
        console.log(liabilityBoc);

        client.abi.decode_message()
        // console.log(decoded);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
