pragma ton-solidity >= 0.43.0;

import './interfaces/IERC721.sol';

import './libraries/ArrayFunctions.sol';
import './libraries/ERC721ErrorCodes.sol';

// TODO: рефералка на перевод % с тонов

contract ERC721 {
    mapping(uint32 => Punk) tokens;
    address owner;
    uint32 nftAmount;
    uint32 tokensLeft;
    uint32 totalTokens;
    uint128 priceForSale;
    uint128 referalNominator;
    uint128 referalDenominator;
    bool readyForSale;
    mapping(uint32 => address) nftOwner;
    mapping(address => mapping(uint32 => bool)) collections;
    mapping(uint32 => bool) freeTokens;

    constructor(address owner_) public {
        tvm.accept();
        rnd.shuffle();
        readyForSale = false;
        owner = owner_;
        priceForSale = 1 ton;
        totalTokens = 0;
        tokensLeft = 0;
        nftAmount = 0;
        referalNominator = 10;
        referalDenominator = 100;
    }

    function uploadToken(uint32 tokenID, Punk punkInfo) external onlyOwner {
        tvm.rawReserve(msg.value, 2);
        tokens[tokenID] = punkInfo;
        freeTokens[tokenID] = true;
        totalTokens += 1;
        tokensLeft += 1;
        address(owner).transfer({value: 0, flag: 64});
    }

    function startSell() external onlyOwner {
        tvm.rawReserve(msg.value, 2);
        readyForSale = true;
        address(owner).transfer({value: 0, flag: 64});
    }

    function getOwnerOf(uint32 tokenID) external responsible view returns(address) {
        return {flag: 64} nftOwner[tokenID];
    }

    function mintToken(address referal) external view {
        require(readyForSale, ERC721ErrorCodes.ERROR_SALE_IS_NOT_STARTED);
        require(tokensLeft > 0, ERC721ErrorCodes.ERROR_NO_TOKENS_LEFT);
        require(msg.value >= priceForSale, ERC721ErrorCodes.ERROR_MSG_VALUE_IS_TOO_LOW);
        tvm.accept();
        uint32 tokensToMint = uint32(msg.value/priceForSale);
        if (referal.value != 0) {
            uint128 tokenValue = tokensToMint*priceForSale;
            ERC721(address(this))._payoutReferal(referal, tokenValue*referalNominator/referalDenominator);
        }

        ERC721(address(this))._mintToken(msg.sender, tokensToMint, tokensToMint);

    }

    function _mintToken(address mintTo, uint32 amountLeftToMint, uint32 originalTokenAmount) external onlySelf {
        if (amountLeftToMint > 0) {
            tvm.accept();
            uint32 tokenIDToMint = _getMintedID();

            while (!freeTokens[tokenIDToMint]) {
                tokenIDToMint = _getMintedID();
            }

            nftAmount += 1;
            tokensLeft -= 1;
            delete freeTokens[tokenIDToMint];

            nftOwner[tokenIDToMint] = mintTo;
            collections[mintTo][tokenIDToMint] = true;
            ERC721(address(this))._mintToken(mintTo, amountLeftToMint - 1, originalTokenAmount);
        }
    } 

    function _getMintedID() internal view returns (uint32) {
        rnd.shuffle();
        uint32 index = rnd.next(uint32(totalTokens));
        rnd.shuffle();
        uint8 iterations = rnd.next(uint8(10));
        if (tokensLeft < iterations) {
            optional(uint32, bool) returnIndex = freeTokens.nextOrEq(index);
            if (returnIndex.hasValue()) {
                (index, ) = returnIndex.get(); 
            } else {
                optional(uint32, bool) minIndex = freeTokens.min();
                (index, ) = minIndex.get();
            }
        } else {
            repeat(iterations) {
                optional(uint32, bool) currentToken = freeTokens.nextOrEq(index);
                if (currentToken.hasValue()) {
                    (uint32 currentIndex, ) = currentToken.get();
                    index = currentIndex;
                } else {
                    optional(uint32, bool) minToken = freeTokens.min();
                    (uint32 currentIndex, ) = minToken.get();
                    index = currentIndex;
                }
            }
        }
        return index;
    }

    function _payoutReferal(address receiver, uint128 valueToTransfer) external pure onlySelf {
        tvm.accept();
        address(receiver).transfer({value: valueToTransfer});
    }

    function transferTokenTo(uint32 tokenID, address receiver) external {
        require(msg.value >= 0.5 ton, ERC721ErrorCodes.ERROR_MSG_VALUE_IS_TOO_LOW);
        require(nftOwner[tokenID] == msg.sender, ERC721ErrorCodes.ERROR_MSG_SENDER_IS_NOT_NFT_OWNER);
        tvm.rawReserve(msg.value, 2);

        collections[msg.sender][tokenID] = false;

        nftOwner[tokenID] = receiver;

        collections[receiver][tokenID] = true;
        address(msg.sender).transfer({flag: 64, value: 0});
    }

    function getAllNfts() external responsible view returns(mapping(uint32 => Punk)) {
        return {flag: 64} tokens;
    }

    function getUserNfts(address collector) external responsible view returns(mapping(uint32 => bool)) {
        return {flag: 64} collections[collector];
    }

    function getNft(uint32 nftID) external responsible view returns(Punk, address collector) {
        return {flag: 64} (tokens[nftID], nftOwner[nftID]);
    }

    function getTokenSupplyInfo() external responsible view returns(uint32 tokenAmount, uint32 notMintedTokens) {
        return {flag: 64} (nftAmount, tokensLeft);
    }

    function getTokenPrice() external responsible view returns(uint128) {
        return {flag: 64} priceForSale;
    } 

    function setBuyPrice(uint128 priceForSale_) external onlyOwner {
        tvm.accept();
        priceForSale = priceForSale_;
        address(owner).transfer({value: 0, flag: 64});
    }

    function setReferalParams(uint128 refNom, uint128 refDenom) external onlyOwner {
        tvm.accept();
        referalNominator = refNom;
        referalDenominator = refDenom;
        address(owner).transfer({value: 0, flag: 64});
    }

    function getReferalParams() external responsible view returns (uint128, uint128) {
        return {flag: 64} (referalNominator, referalDenominator);
    }

    function withdrawExtraTons(uint128 tonsToWithdraw) external view onlyOwner {
        tvm.accept();
        address(owner).transfer({value: tonsToWithdraw, flag: 64});
    }

    modifier onlyOwner() {
        require(msg.sender == owner, ERC721ErrorCodes.ERROR_MSG_SENDER_IS_NOT_OWNER);
        _;
    }

    modifier onlySelf() {
        require(msg.sender == address(this));
        _;
    }
}