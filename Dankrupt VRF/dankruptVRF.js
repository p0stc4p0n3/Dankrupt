var collectionData;
var collectionMetas;
var totalMints;
var availableMintMetaCids = [];
var availableMintMetas = [];
var availableMintImages = [];
var availableMintHashes = [];
var availableMintTargets = [];
var transactionData;
var winningRolls = [];
var stagedAddresses = [];
var unhashedEntries = [];
var hashedEntries = [];
var seedHash = "";
var vrfResults = [];

$.ajaxSetup({
    async: false
});

$.getJSON(collectionInput,
    function (defineMint) {
        collectionData = defineMint;
    }
);

totalMints = Object.keys(collectionData.metaCids).length;

for (let i = 0; i < totalMints; i++) {
    availableMintMetaCids.push(collectionData.metaCids["cid" + `${i + 1}`]);
    $.getJSON("https://loopring.mypinata.cloud/ipfs/" + `${availableMintMetaCids[i]}`,
        function (getAvailableMeta) {
            availableMintMetas.push(getAvailableMeta);
        }
    );
    availableMintImages.push(availableMintMetas[i].image);
    availableMintHashes.push(sha256(availableMintImages[i]));
};

$.getJSON(transactionInput,
    function (defineTransactions) {
        transactionData = defineTransactions;
    }
);

for (let j = 0; j < Object.keys(transactionData).length; j++) {
    stagedAddresses.push(transactionData["transaction" + `${j + 1}`]);
    stagedAddresses[j].value = Math.floor(stagedAddresses[j].value / collectionData.perMintCost);
};

for (let k = 0; k < stagedAddresses.length; k++) {
    checkAddress = stagedAddresses[k].ethAddress;
    checkAddressValue = stagedAddresses[k].value;
    for (let l = k; l < stagedAddresses.length; l++) {
        if (k != l) {
            if (checkAddress == stagedAddresses[l].ethAddress) {
                combinedAddressValue = checkAddressValue + stagedAddresses[l].value;
                stagedAddresses[k].value = combinedAddressValue;
                stagedAddresses.splice(l, 1);
            };
        };
    };
    if (stagedAddresses[k].value > collectionData.maxMintPerPerson) {
        stagedAddresses[k].value = parseInt(collectionData.maxMintPerPerson, 10);
    };
};

for (let m = 0; m < Object.keys(stagedAddresses).length; m++) {
    for (let n = 0; n < stagedAddresses[m].value; n++) {
        unhashedEntries.push(stagedAddresses[m].ethAddress);
        hashedEntries.push(sha256(`${stagedAddresses[m].ethAddress}` + `${n}`));
    };
};

hashedEntries = hashedEntries.slice(0, Object.keys(collectionData.metaCids).length);
seedHash = sha256(`${hashedEntries}`);

for (let o = 0; o < Object.keys(collectionData.metaCids).length; o++) {
    availableMintTargets.push(parseInt(sha256(`${availableMintHashes[o]}` + `${seedHash}`), 16) % 100000000);
};

for (let o =0; o < hashedEntries.length; o++) {
    winningRolls.push(parseInt(sha256(`${hashedEntries[o]}` + `${seedHash}`), 16) % 100000000);
}

function findClosest(num, arr) {
    var mid;
    var lo = 0;
    var hi = arr.length - 1;
    while (hi - lo > 1) {
        mid = Math.floor((lo + hi) / 2);
        if (arr[mid] < num) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    if (num - arr[lo] <= arr[hi] - num) {
        return arr[lo];
    }
    return arr[hi];
}

for (p = 0; p < Object.keys(collectionData.metaCids).length; p++) {
    currentRoll = Math.min.apply(Math, winningRolls);
    currentWin = findClosest(currentRoll, availableMintTargets);
    for (q = 0; q < winningRolls.length; q++) {
        if (currentRoll == winningRolls[q]) {
            for (r = 0; r < availableMintTargets.length; r++) {
                if (currentWin == availableMintTargets[r]) {
                    vrfResults.push(`${unhashedEntries[q]}` + " has won " + `${availableMintImages[r]}`)
                    winningRolls.splice(q, 1);
                    unhashedEntries.splice(q, 1);
                    availableMintTargets.splice(r, 1);
                    availableMintImages.splice(r, 1);
                };
            };
        };
    };
};


console.log(vrfResults);