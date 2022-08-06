ERC20 standard is used for token manipulations. TON Blockchain's ExctraCurrency mechanism should be used instead, but it is unsupported presently. 

## Architectural changes w.r.t. Ethereum Robonomics contracts
1. Liabilities are part of Lighthouse persistent state, not separate contracts
2. More complicated provider queuing logic, fines for not being online introduced
3. Factory is now Root; used only for creating Lighthouses and (as planned) minting XRTs on Lighthouses queries.
4. On-chain validator now is capable of more complex logic, not only telling if pubkey is valid off-chain validator.
5. Penalty for not completing the task is introduced for executor (it is a new parameter which must coincide in demand-offer matching)
6. Creating a demand customer (as well as executor creating an offer) has to sign isDemand field (which prevents demand-offer replacement attacks).
7. Users of Lighthouse (providers, customers, executors) must initially transfer some balance to the Lighthouse contract and only then perform any kind of operations (not just approving this spending for Lighthouse contract). 
8. Time periods is measured in unixtime, not blocks.

## Notes
7th architectural change simplifies payment logic complicated by TON Blockchain asynchronous nature (of contracts interaction).
Also it allows Lighthouse contract to be naturally modified to work with ExctraCurrency way of token manilupation.
#### TIP3 tokens
TIP3 standart is not used because it is quite akward and not depeloped enought. 
There is [descripiton](https://forum.freeton.org/t/tip-3-distributed-token-or-ton-cash/64) and reference [implementation](https://github.com/tonlabs/ton-labs-contracts/tree/master/cpp/tokens-fungible) which actually don't match each other (for example, implementation allows on-chain wallet owners and description doesn't).
Anyway, because TIP3 significantly relies on predefined and known in advance wallet code (which actually is an interesting idea), we have to create a wallet owned by lighthouse contract at least for every diferrent token "type" involved in the liabilities. 
Moreover, because reference wallets don't send any events related to token receipts to their onchain owner (we can only request wallet balance), we can't distinguish transfers from different parties, so actually we have to create a wallet for every party willing to hold some balance on our contract.
This is quite akward in my opinion. Anyway, it also can be implemented. After all, I see no reason in introducing a new token standart instead of supporting built-in TON Blockchain's ExctraCurrency mechanism. 

## Known issues
There is a few issues related to storage fees collected by TON Blockchain.

First of all, we have to decide who is responsible for paying for the storage. One way is to just reserve some small balance and return change +- the difference between desired and actual balance when invoking any external method of the contract, thus requring users to pay for the storage in random proportions.

There are other ones:
1. someone could spam root contract with create liability queries, thus leading to large storage fees of isLighthouse map or/and wasting good names of lighthouses with bad parametrs.
\
Ways to fix: 
   * make some sort of auction on names (or use TonDNS mechanisms for it)
   * increase create lighthouse price
   * don't store the whole map -- instead check Merkle-proofs of entries (too complicated with this language unfortunately)
2. someone could spam Lighthouse contract with refillBalance queries with incorrect token address, thus leading to large storage fees of pending queries map.
\
Ways to fix: 
   * hold some gram value of the message until the response actually is received
   * delete old entries from the map
3. someone could spam Lighthouse contract with refillBalance queries with very small (by actual market value) amount of tokens, thus leading to large storage fees of balances map.
\
Ways to fix: 
   * hold some gram value of the message until the balance is fully withdrawn
   * introduce some price for this query.
4. provider could spam Lighthouse contract with createLiability queries and never finalize these liabilities, thus leading to large storage fees of liabilityByHash map.
\
Ways to fix: 
   * forcibly delete expired liabilities, make the price of createLiability depend on the deadline time.


## Definitions
There is a root - person who can mint XRT, create lighthouses,  
XRT - is a ERC20 token that used to pay robots,  
customer - person who publishes the demand,  
executor - person who publishes the offer,  
lighthouse - smart-contract that matches demand and offer,  
validator - person who monitors execution of the offer,  
provider - person who placed his stake in lighthouse and receives a fee for doing work within the system


## How it works
1. Customer publishes the demand, executor publishes the offer.
2. Lighthouse matches demand and offer and creates a liability.
3. Executor starts work.
4. After work, the executor sends a log of operations performed.
5. Validtors decide if the liability is done.
6. Validtors send a message about the result.
7. Lighthouse finalizes the liability.
8. Validators recieve fee in Ever, Provider in XRT.
9. Executor gets payment.