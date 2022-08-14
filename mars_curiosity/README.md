# FreeTON Robonomics
FreeTON version of [robonomics contracts](https://github.com/airalab/robonomics_contracts).

Some architectural changes have also been made (see contracts/README.md for more info).

## Installation
After cloning the repo, install with `npm install`.     
You must install evedev globally by run `npm i -g everdev`

## RUN MARS ROVER
Before run mars rover via everscale, it's assumed that you ran it [via polkadot](https://wiki.robonomics.network/docs/en/connect-mars-curiosity-rover-under-robonomics-parachain-control/) or at least withoud blockchain.

First of all, you must compile smart contracts. All works fine of 0.47.0 everdev solidity compiler. After cloning repo:
```console
cd everscale-iot-manual/mars_curiosity/scripts/
bash compile.sh
```
It will compile 5 smart contracts: SimpleWallet, XRT, Root, LightHouse and MultivalidatorExample.
After that you must start local blockchain by
```console
everdev se start
```
> Note: to do that you must have docker running

Generate new keys:
```console 
node newKeys.js
```
Deploy contracts:
```console
node deployContracts.js
```
Create simple wallet, create lighthouse, refill balance and register provider:
```console
node createSimpleWallets.js
cd tests/
node createLighthouse.js
node refillBalance.js
node registerProvider.js
```

After all, run ipfs in different terminal:
```console 
ipfs daemon
```

In different terminal run 
```console
roslaunch curiosity_mars_rover_description main_real_mars.launch
```

In different terminal launch new liability poller
```console
node ../newLiabilityPoller.js
```

And in different terminal create new liability, so poller will catch that and start rover
```console
node createLiability.js
```
After 1 minute, in terminal where you start createLiability.js you will see that emited new event LiabilityFinalized.
With result that contains bytes of ipfs hash of report.
