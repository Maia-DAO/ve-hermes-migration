const { ethers } = require("hardhat");
const fs = require('fs');

const abi = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function tokensOfOwner(address _owner) external view returns (uint256[] memory)",
    "function locked(uint256 tokenId) external view returns (int128 amount, uint256 end)"
];

const multicallAbi = [
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "target",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes",
                        "name": "callData",
                        "type": "bytes"
                    }
                ],
                "internalType": "struct Multicall.Call[]",
                "name": "calls",
                "type": "tuple[]"
            }
        ],
        "name": "aggregate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "blockNumber",
                "type": "uint256"
            },
            {
                "internalType": "bytes[]",
                "name": "returnData",
                "type": "bytes[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const multicallAddress = '0x5D78bF8f79A66e43f5932c1Ae0b8fA6563F97f74';

const contractAddress = '0xa4C546c8F3ca15aa537D2ac3f62EE808d915B65b';

const provider = ethers.provider;

const veContract = new ethers.Contract(contractAddress, abi, provider);

const multicallContract = new ethers.Contract(multicallAddress, multicallAbi, provider);

const CREATION_BLOCK = 1324880
const MIGRATION_BLOCK = 17706711

const ADDRESSES_TO_IGNORE = new Set([
    '0x0000000000000000000000000000000000000000'
]);

async function getHolders(veContract, fromBlock, toBlock) {
    const logs = await fetchLogsInBatches(veContract, fromBlock, toBlock, 10000);
    console.log("🚀 ~ getHolders ~ logs:", logs)

    const uniqueAddresses = new Set();
    for (const log of logs) {
        const from = '0x' + log.topics[1].slice(26);
        const to = '0x' + log.topics[2].slice(26);
        if (!ADDRESSES_TO_IGNORE.has(from)) uniqueAddresses.add(from);
        if (!ADDRESSES_TO_IGNORE.has(to)) uniqueAddresses.add(to);
    }

    return Array.from(uniqueAddresses);
}

async function fetchLogsInBatches(veContract, startBlock, endBlock, batchSize) {
    let currentBlock = startBlock;
    let allLogs = [];

    while (currentBlock <= endBlock) {
        const batchEndBlock = Math.min(currentBlock + batchSize - 1, endBlock);
        try {
            const filter = veContract.filters.Transfer();
            const logs = await veContract.queryFilter(filter, currentBlock, batchEndBlock);
            allLogs = allLogs.concat(logs);
            currentBlock = batchEndBlock + 1;
        } catch (error) {
            console.error('Error fetching logs:', error);
            break;
        }
    }
    return allLogs;
}

async function batchCalls(calls, batchSize) {
    const results = [];
    for (let i = 0; i < calls.length; i += batchSize) {
        const batch = calls.slice(i, i + batchSize);
        const { returnData } = await multicallContract.aggregate(batch);
        results.push(...returnData);
    }
    return results;
}

async function getTokenIdsForHolders(holders) {

    const batchSize = 500;
    const calls = holders.map(holder => ({
        target: contractAddress,
        callData: new ethers.utils.Interface(abi).encodeFunctionData('tokensOfOwner', [holder])
    }));

    const returnData = await batchCalls(calls, batchSize);

    return holders.map((holder, index) => {

        const decoded = new ethers.utils.Interface(abi).decodeFunctionResult('tokensOfOwner', returnData[index])[0];

        const tokenIds = decoded.map(id => BigInt(id.toString()));

        return { holder, tokenIds };
    }).filter(holderData => holderData.tokenIds.length > 0);
}

async function getLockedERC20TokensForTokenIds(tokenIds, blockNumber) {

    const batchSize = 500;
    const calls = tokenIds.flat().map(tokenId => ({
        target: contractAddress,
        callData: new ethers.utils.Interface(abi).encodeFunctionData('locked', [tokenId])
    }));

    const returnData = await batchCalls(calls, batchSize, blockNumber);

    const flattenedTokenIds = tokenIds.flat();

    const decodedResults = returnData.map((data, index) => {
        const [amount, end] = new ethers.utils.Interface(abi).decodeFunctionResult('locked', data);
        return {
            tokenId: flattenedTokenIds[index],
            lockedAmount: BigInt(amount.toString()),
            end: BigInt(end.toString())
        };
    });

    const filteredResults = decodedResults.filter(({ lockedAmount }) => lockedAmount > 0n);

    let resultIndex = 0;
    const groupedResults = tokenIds.map(ids => {
        const group = filteredResults.slice(resultIndex, resultIndex + ids.length);
        resultIndex += ids.length;
        return group;
    });

    return groupedResults;
}

async function consolidateData(holders) {
    const holdersWithTokens = await getTokenIdsForHolders(holders);

    const tokenIds = holdersWithTokens.map(holderData => holderData.tokenIds);
    const lockedData = await getLockedERC20TokensForTokenIds(tokenIds);

    const consolidated = holdersWithTokens.map((holderData, index) => {
        const tokenLockedInfo = lockedData[index];
        const totalLocked = tokenLockedInfo.reduce((sum, { lockedAmount }) => sum + BigInt(lockedAmount), BigInt(0)).toString();

        return {
            holder: holderData.holder,
            tokens: holderData.tokenIds.map(id => id.toString()), // Convert token IDs to strings
            totalLockedERC20: totalLocked
        };
    });

    return consolidated;
}

(async () => {
    try {
        const fromBlock = CREATION_BLOCK;
        const toBlock = MIGRATION_BLOCK;

        const holders = await getHolders(veContract, fromBlock, toBlock);
        console.log('NFT Holders:', holders);

        // FOR TEST PURPOSES:
        // const holders = ['0xa4c546c8f3ca15aa537d2ac3f62ee808d915b65b',
        //     '0x77314eaa8d99c2ad55f3ca6df4300cfc50bdbc7f',
        //     '0x88e07a0457aa113ab910103d9a01217315da1c98',
        //     '0x00000738ee284aaa98a0d511cbd655a1e9d653cd',]

        const consolidatedData = await consolidateData(holders);
        console.log('Consolidated Data:', consolidatedData);

        fs.writeFileSync('locked_balances.json', JSON.stringify(consolidatedData, null, 2));
        console.log('Data saved to locked_balances.json');
    } catch (error) {
        console.error('Error:', error);
    }
})();