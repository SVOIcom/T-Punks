pragma ton-solidity >= 0.43.0;

import './interfaces/IERC721.sol';
import './interfaces/IUpgradableContract.sol';

import './libraries/ArrayFunctions.sol';
import './libraries/ERC721ErrorCodes.sol';

// TODO: рефералка на перевод % с тонов

contract ERC721 is IPunk, IUpgradableContract{
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
    mapping(uint32 => SellPunk) tokensForSale;

    /**
     * @param owner_ Owner of the contract
     */
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

    /**
     * @param tokenID ID of nft token
     * @param punkInfo Information required for punk
     */
    function uploadToken(uint32 tokenID, Punk punkInfo) external override onlyOwner {
        tvm.rawReserve(msg.value, 2);
        if (!freeTokens[tokenID]) {
            tokens[tokenID] = punkInfo;
            freeTokens[tokenID] = true;
            totalTokens += 1;
            tokensLeft += 1;
        }
        address(owner).transfer({value: 0, flag: 64});
    }

    function startSell() external override onlyOwner {
        tvm.rawReserve(msg.value, 2);
        readyForSale = true;
        address(owner).transfer({value: 0, flag: 64});
    }

    /**
     * @param referal Address where 10 % payout will be paid
     */
    function mintToken(address referal) external override view {
        // require(readyForSale, ERC721ErrorCodes.ERROR_SALE_IS_NOT_STARTED);
        // require(tokensLeft > 0, ERC721ErrorCodes.ERROR_NO_TOKENS_LEFT);
        // require(msg.value >= priceForSale, ERC721ErrorCodes.ERROR_MSG_VALUE_IS_TOO_LOW);
        tvm.rawReserve(msg.value, 2);
        uint32 tokensToMint = uint32(msg.value/priceForSale);
        if (
            (readyForSale) && 
            (tokensLeft > 0) &&
            (msg.value >= priceForSale) &&
            (tokensToMint <= tokensLeft)
        ) {
            if (referal.value != 0) {
                uint128 tokenValue = tokensToMint*priceForSale;
                ERC721(address(this))._payoutReferal(referal, tokenValue*referalNominator/referalDenominator);
            }

            ERC721(address(this))._mintToken(msg.sender, tokensToMint, tokensToMint);
        } else {
            address(msg.sender).transfer({value: 0, flag: 64});
        }
    }

    /**
     * @param mintTo Address of future owner
     * @param amountLeftToMint Amount of tokens left to mint
     * @param originalTokenAmount Original amount of tokens that requires to be minted
     */
    function _mintToken(address mintTo, uint32 amountLeftToMint, uint32 originalTokenAmount) external override onlySelf {
        tvm.accept();
        if (amountLeftToMint > 0 && tokensLeft > 0) {
            uint32 tokenIDToMint = _getMintedID();

            while (!freeTokens[tokenIDToMint]) {
                tokenIDToMint = _getMintedID();
            }

            nftAmount += 1;
            tokensLeft -= 1;
            delete freeTokens[tokenIDToMint];

            nftOwner[tokenIDToMint] = mintTo;
            collections[mintTo][tokenIDToMint] = true;

            emit PunkMinted({
                punkId: tokenIDToMint,
                mintedBy: mintTo,
                price: priceForSale,
                mintTime: uint64(now)
            });

            ERC721(address(this))._mintToken(mintTo, amountLeftToMint - 1, originalTokenAmount);
        } else {
            if (amountLeftToMint > 0 && tokensLeft == 0) {
                uint128 valueToTransfer = amountLeftToMint * priceForSale;
                address(mintTo).transfer({value: valueToTransfer, flag: 1});
            }
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

    /**
     * @param receiver Address of payout receiver
     * @param valueToTransfer Value to transfer using referal program
     */
    function _payoutReferal(address receiver, uint128 valueToTransfer) external override pure onlySelf {
        tvm.accept();
        address(receiver).transfer({value: valueToTransfer, flag: 1});
    }

    /**
     * @param tokenID ID of nft token
     * @param receiver Address of receiver
     */
    function transferTokenTo(uint32 tokenID, address receiver) external override {
        // require(msg.value >= 0.5 ton, ERC721ErrorCodes.ERROR_MSG_VALUE_IS_TOO_LOW);
        // require(nftOwner[tokenID] == msg.sender, ERC721ErrorCodes.ERROR_MSG_SENDER_IS_NOT_NFT_OWNER);
        tvm.rawReserve(msg.value, 2);

        if (
            (msg.value >= 0.5 ton) && 
            (nftOwner[tokenID] == msg.sender)
        ) {
            collections[msg.sender][tokenID] = false;

            nftOwner[tokenID] = receiver;

            collections[receiver][tokenID] = true;

            if (tokensForSale[tokenID].price != 0) {
                delete tokensForSale[tokenID];
            }

            emit PunkTransferred({
                punkId: tokenID,
                from: msg.sender,
                to: receiver,
                transferTime: uint64(now)
            }); 
        }

        address(msg.sender).transfer({flag: 64, value: 0});
    }

    /**
     * @param tokenID ID of nft token
     * @param tokenPrice Sell price
     */
    function setForSale(uint32 tokenID, uint128 tokenPrice) external override {
        // require(msg.value >= 0.5 ton, ERC721ErrorCodes.ERROR_MSG_VALUE_IS_TOO_LOW);
        // require(nftOwner[tokenID] == msg.sender, ERC721ErrorCodes.ERROR_MSG_SENDER_IS_NOT_NFT_OWNER);
        tvm.rawReserve(msg.value, 2);

        if (
            (msg.value >= 0.5 ton) &&
            (nftOwner[tokenID] == msg.sender)
        ) {
            if (tokenPrice >= 1 ton) {
                tokensForSale[tokenID] = SellPunk({
                    price: tokenPrice,
                    owner: msg.sender
                });
            }
        }

        address(msg.sender).transfer({value: 0, flag: 64});
    }

    /**
     * @param tokenID ID of nft token
     */
    function setAsNotForSale(uint32 tokenID) external override {
        // require(msg.value >= 0.5 ton, ERC721ErrorCodes.ERROR_MSG_VALUE_IS_TOO_LOW);
        // require(tokensForSale[tokenID].owner == msg.sender, ERC721ErrorCodes.ERROR_MSG_SENDER_IS_NOT_NFT_OWNER);
        tvm.rawReserve(msg.value, 2);

        if (
            (msg.value >= 0.5 ton) &&
            (tokensForSale[tokenID].owner == msg.sender)
        ) {
            delete tokensForSale[tokenID];
        }

        address(msg.sender).transfer({value: 0, flag: 64});
    }

    /**
     * @param tokenID ID of nft token
     */
    function buyToken(uint32 tokenID) external override {
        // require(tokensForSale[tokenID].price > 0);
        // require(tokensForSale[tokenID].owner == nftOwner[tokenID]);
        // require(msg.value >= tokensForSale[tokenID].price, ERC721ErrorCodes.ERROR_MSG_VALUE_IS_TOO_LOW);
        tvm.rawReserve(msg.value, 2);
        if (
            (tokensForSale[tokenID].price > 0) &&
            (tokensForSale[tokenID].owner == nftOwner[tokenID]) &&
            (msg.value >= tokensForSale[tokenID].price)
        ) {
            nftOwner[tokenID] = msg.sender;
            collections[msg.sender][tokenID] = true;
            collections[tokensForSale[tokenID].owner][tokenID] = false;

            address(tokensForSale[tokenID].owner).transfer({value: tokensForSale[tokenID].price, flag: 1});

            emit PunkSold(
                tokenID,
                tokensForSale[tokenID].owner,
                msg.sender,
                uint64(now)
            );

            delete tokensForSale[tokenID];
        } else {
            address(msg.sender).transfer({value: 0, flag: 64});
        }
    }

    /**
     * @param priceForSale_ Price of minting tokens
     */
    function setBuyPrice(uint128 priceForSale_) external override onlyOwner {
        tvm.accept();
        priceForSale = priceForSale_;
        address(owner).transfer({value: 0, flag: 64});
    }

    /**
     * @param refNom reference program nominator
     * @param refDenom reference program denominator
     */
    function setReferalParams(uint128 refNom, uint128 refDenom) external override onlyOwner {
        tvm.accept();
        referalNominator = refNom;
        referalDenominator = refDenom;
        address(owner).transfer({value: 0, flag: 64});
    }

    /**
     * @param tonsToWithdraw Amount of tons to withdraw
     */
    function withdrawExtraTons(uint128 tonsToWithdraw) external override view onlyOwner {
        tvm.accept();
        address(owner).transfer({value: tonsToWithdraw, flag: 64});
    }

    /**
     * @param tokenID ID of nft token
     */
    function getOwnerOf(uint32 tokenID) external override responsible view returns(address) {
        return {flag: 64} nftOwner[tokenID];
    }

    function getAllTokensForSale() external override responsible returns(mapping(uint32 => SellPunk)) {
        return {value: 0, flag: 64} tokensForSale;
    }

    /**
     * @param tokenID ID of nft token
     */
    function getSellInfo(uint32 tokenID) external override responsible returns(SellPunk) {
        return {value: 0, flag: 64} tokensForSale[tokenID];
    }

    function getAllNfts() external override responsible view returns(mapping(uint32 => Punk)) {
        return {flag: 64} tokens;
    }

    /**
     * @param collector Address of nft owner
     */
    function getUserNfts(address collector) external override responsible view returns(mapping(uint32 => bool)) {
        return {flag: 64} collections[collector];
    }

    /**
     * @param nftID ID of nft token
     */
    function getNft(uint32 nftID) external override responsible view returns(Punk, address collector) {
        return {flag: 64} (tokens[nftID], nftOwner[nftID]);
    }

    function getTokenSupplyInfo() external override responsible view returns(uint32 mintedTokens, uint32 notMintedTokens) {
        return {flag: 64} (nftAmount, tokensLeft);
    }

    function getTokenPrice() external override responsible view returns(uint128) {
        return {flag: 64} priceForSale;
    }

    
    function getReferalParams() external override responsible view returns (uint128, uint128) {
        return {flag: 64} (referalNominator, referalDenominator);
    } 

    receive() external view {
        if (msg.sender == owner) {
            tvm.accept();
            address(owner).transfer({value: address(this).balance - 10 ton, flag: 0});
        }
    }

    function upgradeContractCode(TvmCell code, TvmCell updateParams, uint32 codeVersion_) external override onlyOwner {
        tvm.rawReserve(msg.value, 2);
        TvmBuilder builder;

        builder.store(owner);
        builder.store(nftAmount);
        builder.store(tokensLeft);
        builder.store(totalTokens);
        builder.store(priceForSale);
        builder.store(referalNominator);
        builder.store(referalDenominator);
        builder.store(readyForSale);

        TvmBuilder mappingStorage;
        TvmBuilder nftOwnerB;
        nftOwnerB.store(nftOwner);
        TvmBuilder collectionsB;
        collectionsB.store(collections);
        TvmBuilder freeTokensB;
        freeTokensB.store(freeTokens);
        TvmBuilder tokensForSaleB;
        tokensForSaleB.store(tokensForSale);

        mappingStorage.store(nftOwnerB.toCell());
        mappingStorage.store(collectionsB.toCell());
        mappingStorage.store(freeTokensB.toCell());
        mappingStorage.store(tokensForSaleB.toCell());

        builder.store(updateParams);
        builder.store(mappingStorage.toCell());

        tvm.setcode(code);
        tvm.setCurrentCode(code);

        onCodeUpgrade(builder.toCell());
    }

    function onCodeUpgrade(TvmCell oldVariables) private {
        tvm.resetStorage();
        TvmSlice upgrd = oldVariables.toSlice();
        (
            owner,
            nftAmount,
            tokensLeft,
            totalTokens,
            priceForSale,
            referalNominator,
            referalDenominator,
            readyForSale
        ) = upgrd.decode(address, uint32, uint32, uint32, uint128, uint128, uint128, bool);

        TvmCell params = upgrd.loadRef();
        TvmSlice mappings = upgrd.loadRefAsSlice();
        TvmSlice tmp = mappings.loadRefAsSlice();
        nftOwner = tmp.decode(mapping(uint32 => address));
        tmp = mappings.loadRefAsSlice();
        collections = tmp.decode(mapping(address => mapping(uint32 => bool)));
        tmp = mappings.loadRefAsSlice();
        freeTokens = tmp.decode(mapping(uint32 => bool));
        tmp = mappings.loadRefAsSlice(); 
        tokensForSale = tmp.decode(mapping(uint32 => SellPunk));
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