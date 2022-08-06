const { TonClient, signerKeys, signerNone, signerExternal } = require("@tonclient/core");
const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");

const { LighthouseContract } = require('../artifacts/LighthouseContract.js');
const { RootContract } = require('../artifacts/RootContract.js');
const { XRTContract } = require('../artifacts/XRTContract.js');

async function constructContracts(client, keys) {
  const root = new Account(RootContract, {initData: {'lighthouseCodeHash' : '0x' + LighthouseContract.codeHash},
                                          signer: signerKeys(keys),
                                          client: client});
  const xrt = new Account(XRTContract, {initData: {'root' : await root.getAddress(),
                                                   '_name' : Buffer.from('Robonomics.network').toString('hex'),
                                                   '_symbol' : Buffer.from('XRT').toString('hex')},
                                        signer: signerKeys(keys),
                                        client: client});
  return { root, xrt }
}

async function getLighthouseAddress(client, root, xrt, name) {
  const lighthouse = new Account(LighthouseContract, {initData : {'name' : Buffer.from(name).toString('hex'),
                                                                  'root' : await root.getAddress(),
                                                                   'xrt' : await xrt.getAddress()},
                                                      client: client,
                                                      signer: signerExternal('0000000000000000000000000000000000000000000000000000000000000000')})

  return (await lighthouse.getAddress())
}


module.exports = { constructContracts, getLighthouseAddress }
