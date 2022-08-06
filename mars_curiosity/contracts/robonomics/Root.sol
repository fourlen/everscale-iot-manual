pragma ton-solidity >= 0.42.0;

import './Lighthouse.sol';
import './XRT.sol';


//root is a person who can mint XRT, create lighthouses


contract Root  {
    event NewLighthouse(address lighthouse, string name);

    mapping(address => bool) public isLighthouse; // should be used unit type instead

    modifier returnsChange() {
        tvm.rawReserve(address(this).balance - msg.value, 0); //reserves extra EVERs

        _;  //code goes here

        msg.sender.transfer({value: 0, flag: 128}); //transfers the reserved EVERs (flag 128 means to send all tokens from this contract)
    }


    struct ToMint {
        address to;
        uint128 value;
    }


    //When you create a root, you must specify the address of the XRT token and toMint array.
    //each {ToMint.to} will receive {ToMint.value} XRT
    constructor(address _xrt, ToMint[] toMint) public {
        require(msg.pubkey() == tvm.pubkey()); // check that we are not being deployed by a hacker
        tvm.accept();

        xrt = _xrt;   //Bind root to the XRT address

        for (ToMint info : toMint) {
            XRT(xrt).mint{value: 0.5 ton}(info.to, info.value);     //mint {ToMint.value} XRT for every {toMint.to}
        }
    }

    uint256 static public lighthouseCodeHash; //lighthouse code hash is needed to release the only version of lighthouse
    address public xrt; //XRT address that this user can mint

    // cost: value (should be >= gasToValue(1000000, 0) ~= 1 ton) nanotons for lighthouse balance + fees; returns change
    function createLighthouse(
        TvmCell lighthouseCode, // hash should match the stored one
        uint128 value,
        LighthouseParams params,
        string  name
    )
        external
        responsible // it will send the output value with change message
        returns (address)
    {
        // reserve the initial balance of the account
        // i.e. we would spend only the value of the message
        tvm.rawReserve(address(this).balance - msg.value, 0);
        // tvm.rawReserve(msg.value, 12); looks better; not sure, if flag = 12 works properly

        require(tvm.hash(lighthouseCode) == lighthouseCodeHash);    //check for the release of the correct lighthouse

        uint256 LIGHTHOUSE_NODE
            // lighthouse.5.robonomics.ton
            = 0; // TODO: encoding?
        uint256 hname = sha256(name);

        // Name reservation check
        //uint256 subnode = sha256(abi.encodePacked(LIGHTHOUSE_NODE, hname));
        //require(ens.resolver(subnode) == address(0));

        // Create lighthouse
        require(value >= gasToValue(1000000, 0));
        require(name.byteLength() < 128);
        require(params.timeout > 0);
        address lighthouse = new Lighthouse{
          value: value,
          code: lighthouseCode,
          pubkey: 0, // there is no owner (why they think every contract should have this field?)
          varInit: {name: name,
                    root: address(this),
                    xrt: xrt}
        }(params); // lighthouse address will depend only on the name (and root, xrt addresses)

        require(!isLighthouse.exists(lighthouse)); // the creating message won't be send if this check fails; and the value will be bounced to msg.sender

        emit NewLighthouse(lighthouse, name);
        isLighthouse[lighthouse] = true;

        // Register subnode
        //ens.setSubnodeOwner(LIGHTHOUSE_NODE, hname, address(this));

        // Register lighthouse address
        //AbstractResolver resolver = AbstractResolver(ens.resolver(LIGHTHOUSE_NODE));
        //ens.setResolver(subnode, address(resolver));
        //resolver.setAddr(subnode, address(lighthouse));

        // return the change and lighthouse address
        // 128 means sending all the remaining balance
        // note that we have reserved the initial balance, so it will just return unspent value of the message
        return{value: 0, flag: 128} lighthouse;
    }

    function mint_gas(address to, uint128 gas_spent) external returnsChange {
        require(isLighthouse[msg.sender]);

        // some gas to xrt logic here
        XRT(xrt).mint(to, gas_spent);
    }
}
