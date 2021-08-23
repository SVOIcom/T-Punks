pragma ton-solidity >= 0.43.0;

contract ERC721 {

    mapping(uint32 => TvmCell) tokens;
    uint32 nftAmount;
    uint32 tokensLeft;
    uint32 totalTokens;
    uint32 lastMinted;
    mapping(uint32 => address) nftOwner;
    mapping(uint32 => bool) freeTokens;

    constructor(uint32 tokenAmount) public {
        tvm.accept();
        rnd.shuffle();
        lastMinted = rnd.next(uint32(tokenAmount));
        tokensLeft = tokenAmount;
        totalTokens = 0;
    }

    function uploadToken(uint32 tokenID, TvmCell token) external {
        tvm.rawReserve(msg.value, 2);
        tokens[tokenID] = token;
        freeTokens[tokenID] = true;
    }

    function getOwnerOf(uint32 tokenID) external responsible view returns(address) {
        return {flag: 64} nftOwner[tokenID];
    }

    function mintToken() external {
        require(tokensLeft > 0);
        require(msg.value >= 250 ton);
        tvm.rawReserve(1 ton, 2);
        uint32 tokenIDToMint = _getMintedID();
        lastMinted = tokenIDToMint;
        tokensLeft -= 1;
        totalTokens += 1;
        delete freeTokens[tokenIDToMint];

        nftOwner[tokenIDToMint] = msg.sender;
        address(msg.sender).transfer({value: 0, flag: 64});
    }

    function _getMintedID() internal view returns (uint32) {
        uint8 iterations = rnd.next(uint8(10));
        uint32 index = lastMinted;
        if (iterations > tokensLeft) {
            iterations = uint8(tokensLeft);
        }
        repeat(iterations) {
            optional(uint32, bool) currentToken = freeTokens.next(index);
            if (currentToken.hasValue()) {
                (uint32 currentIndex, ) = currentToken.get();
                index = currentIndex;
            } else {
                optional(uint32, bool) minToken = freeTokens.min();
                (uint32 currentIndex, ) = minToken.get();
                index = currentIndex;
            }
        }
        return index;
    }

    function transferTokenTo(uint32 tokenID, address receiver) external {
        require(msg.value >= 1 ton);
        tvm.rawReserve(msg.value, 2);
        if (nftOwner[tokenID] == msg.sender) {
            nftOwner[tokenID] = receiver; 
        }
        address(msg.sender).transfer({flag: 64, value: 0});
    }
}