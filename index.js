const { ethers } = require("hardhat");
const fs = require('fs');

const ve_abi = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function tokensOfOwner(address _owner) external view returns (uint256[] memory)",
    "function locked(uint256 tokenId) external view returns (int128 amount, uint256 end)"
];

const ve_dist_abi = [
    "function claimable(uint256 _tokenId) external view returns (uint256)"
]

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
                "internalType": "struct Multicall2.Call[]",
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
    },
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
                "internalType": "struct Multicall2.Call[]",
                "name": "calls",
                "type": "tuple[]"
            }
        ],
        "name": "blockAndAggregate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "blockNumber",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "blockHash",
                "type": "bytes32"
            },
            {
                "components": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    },
                    {
                        "internalType": "bytes",
                        "name": "returnData",
                        "type": "bytes"
                    }
                ],
                "internalType": "struct Multicall2.Result[]",
                "name": "returnData",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "blockNumber",
                "type": "uint256"
            }
        ],
        "name": "getBlockHash",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "blockHash",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBlockNumber",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "blockNumber",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCurrentBlockCoinbase",
        "outputs": [
            {
                "internalType": "address",
                "name": "coinbase",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCurrentBlockDifficulty",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "difficulty",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCurrentBlockGasLimit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "gaslimit",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCurrentBlockTimestamp",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "addr",
                "type": "address"
            }
        ],
        "name": "getEthBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "balance",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getLastBlockHash",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "blockHash",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bool",
                "name": "requireSuccess",
                "type": "bool"
            },
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
                "internalType": "struct Multicall2.Call[]",
                "name": "calls",
                "type": "tuple[]"
            }
        ],
        "name": "tryAggregate",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    },
                    {
                        "internalType": "bytes",
                        "name": "returnData",
                        "type": "bytes"
                    }
                ],
                "internalType": "struct Multicall2.Result[]",
                "name": "returnData",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bool",
                "name": "requireSuccess",
                "type": "bool"
            },
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
                "internalType": "struct Multicall2.Call[]",
                "name": "calls",
                "type": "tuple[]"
            }
        ],
        "name": "tryBlockAndAggregate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "blockNumber",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "blockHash",
                "type": "bytes32"
            },
            {
                "components": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    },
                    {
                        "internalType": "bytes",
                        "name": "returnData",
                        "type": "bytes"
                    }
                ],
                "internalType": "struct Multicall2.Result[]",
                "name": "returnData",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const multicallAddress = '0x5D78bF8f79A66e43f5932c1Ae0b8fA6563F97f74';

const veAddress = '0xa4C546c8F3ca15aa537D2ac3f62EE808d915B65b';

const veDistAddress = '0x04F783Ff9664bE99aE6fc8C8AeC379A287b27F67';

const provider = ethers.provider;

const veContract = new ethers.Contract(veAddress, ve_abi, provider);

const multicallContract = new ethers.Contract(multicallAddress, multicallAbi, provider);

const CREATION_BLOCK = 1324880
const MIGRATION_BLOCK = 17706711

const ADDRESSES_TO_IGNORE = new Set([
    '0x0000000000000000000000000000000000000000'
]);

async function getHolders(veContract, fromBlock, toBlock) {
    const logs = await fetchLogsInBatches(veContract, fromBlock, toBlock, 10000);

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
        const { returnData } = await multicallContract.aggregate(batch, { gasLimit: 15000000 });
        results.push(...returnData);
    }
    return results;
}

async function tryBatchCalls(calls, batchSize) {
    const requireSuccess = false

    const results = [];
    for (let i = 0; i < calls.length; i += batchSize) {
        const batch = calls.slice(i, i + batchSize);
        const returnData = await multicallContract.tryAggregate(requireSuccess, batch);
        const undefinedResponse = [undefined]

        if (returnData) { results.push(...returnData) } else { results.push(...undefinedResponse) }
    }
    return results;
}

async function getTokenIdsForHolders(holders) {
    const batchSize = 500;

    const calls = holders.map(holder => ({
        target: veAddress,
        callData: new ethers.utils.Interface(ve_abi).encodeFunctionData('tokensOfOwner', [holder])
    }));

    const returnData = await batchCalls(calls, batchSize);

    return holders.map((holder, index) => {

        const decoded = new ethers.utils.Interface(ve_abi).decodeFunctionResult('tokensOfOwner', returnData[index])[0];

        const tokenIds = decoded.map(id => BigInt(id.toString()));

        return { holder, tokenIds };
    }).filter(holderData => holderData.tokenIds.length > 0);
}

async function getLockedAndDistForTokenIds(tokenIds) {
    const batchSize = 500;
    const batchSizeSmall = 100;

    const callsLocked = tokenIds.flat().map(tokenId => ({
        target: veAddress,
        callData: new ethers.utils.Interface(ve_abi).encodeFunctionData('locked', [tokenId])
    }));

    const returnDataLocked = await batchCalls(callsLocked, batchSize);

    const callsClaimable = tokenIds.flat().map(tokenId => ({
        target: veDistAddress,
        callData: new ethers.utils.Interface(ve_dist_abi).encodeFunctionData('claimable', [tokenId])
    }));

    const returnDataClaimable = await tryBatchCalls(callsClaimable, batchSizeSmall);

    const flattenedTokenIds = tokenIds.flat();

    const decodedResults = returnDataLocked.map((data, index) => {
        const [amount, end] = new ethers.utils.Interface(ve_abi).decodeFunctionResult('locked', data);

        const claimable = returnDataClaimable[index] && returnDataClaimable[index] !== undefined && returnDataClaimable[index].success ? new ethers.utils.Interface(ve_dist_abi).decodeFunctionResult('claimable', returnDataClaimable[index].returnData) : 0

        const lockedAmount = BigInt(amount.toString())

        const claimableAmount = BigInt(claimable.toString())

        return {
            tokenId: flattenedTokenIds[index],
            lockedAmount,
            claimableAmount,
            total: lockedAmount + claimableAmount,
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
    const lockedData = await getLockedAndDistForTokenIds(tokenIds);

    const consolidated = holdersWithTokens.map((holderData, index) => {
        const tokenLockedInfo = lockedData[index];
        const totalLocked = tokenLockedInfo.reduce((sum, { lockedAmount }) => sum + BigInt(lockedAmount), BigInt(0)).toString();
        const totalClaimable = tokenLockedInfo.reduce((sum, { claimableAmount }) => sum + BigInt(claimableAmount), BigInt(0)).toString();
        const total = tokenLockedInfo.reduce((sum, { total }) => sum + BigInt(total), BigInt(0)).toString();

        return {
            holder: holderData.holder,
            tokens: holderData.tokenIds.map(id => id.toString()), // Convert token IDs to strings
            totalLockedERC20: totalLocked,
            totalClaimableERC20: totalClaimable,
            totalERC20: total
        };
    });

    return consolidated;
}

(async () => {
    try {
        const fromBlock = CREATION_BLOCK;
        const toBlock = MIGRATION_BLOCK;

        const holders = await getHolders(veContract, fromBlock, toBlock);
        console.log('NFT Holders:', holders.length);

        // FOR TEST PURPOSES:
        // const holders = [
        //     '0xa4c546c8f3ca15aa537d2ac3f62ee808d915b65b',
        //     '0x77314eaa8d99c2ad55f3ca6df4300cfc50bdbc7f',
        //     '0x88e07a0457aa113ab910103d9a01217315da1c98',
        //     '0x00000738ee284aaa98a0d511cbd655a1e9d653cd', 
        //     '0x88E07a0457aA113AB910103d9a01217315DA1C98'
        // ];

        const consolidatedData = await consolidateData(holders);
        console.log('Consolidated Data:', consolidatedData);

        fs.writeFileSync('locked_balances.json', JSON.stringify(consolidatedData, null, 2));
        console.log('Data saved to locked_balances.json');
    } catch (error) {
        console.error('Error:', error);
    }
})();