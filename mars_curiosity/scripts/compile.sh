#!/bin/bash

if [ "$#" == 0 ]; then
    contracts=("robonomics/Root" "robonomics/Lighthouse" "robonomics/XRT" "SimpleWallet" "robonomics/validator/MultiValidatorExample")
else
    declare -a contracts
    for contract in "$@"
    do
        contracts+=($contract)
    done
fi

for contract in "${contracts[@]}"
do
    rm -f ../artifacts/$contract.abi.json
    rm -f ../artifacts/$contract.tvc
    rm -f ../artifacts/"$contract"Contract.js

    echo everdev sol compile ../contracts/$contract.sol
    everdev sol compile ../contracts/$contract.sol &> /dev/null
    contract=$(basename ${contract})
    everdev js wrap $contract.abi.json
    mv $contract.abi.json ../artifacts
    mv $contract.tvc ../artifacts
    mv "$contract"Contract.js ../artifacts
done
