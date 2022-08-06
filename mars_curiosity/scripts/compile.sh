#!/bin/bash

if [ "$#" == 0 ]; then
    contracts=("robonomics/Root" "robonomics/Lighthouse" "robonomics/XRT")
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

    echo npx tondev sol compile ../contracts/$contract.sol
    npx tondev sol compile ../contracts/$contract.sol &> /dev/null
    npx tondev js wrap ../contracts/$contract.abi.json
    mv ../contracts/$contract.abi.json ../artifacts
    mv ../contracts/$contract.tvc ../artifacts
    mv ../contracts/"$contract"Contract.js ../artifacts
done
