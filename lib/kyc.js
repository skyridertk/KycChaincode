/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class KyC extends Contract {

    // CreateAsset - create a new asset, store into chaincode state
    async CreateAsset(ctx, assetID, firstname, lastname, address, dateOfBirth, idNumber, gender, status, approvalCount, owner, proofOfResidence, proofOfId) {
        const exists = await this.AssetExists(ctx, assetID);
        if (exists) {
            throw new Error(`The asset ${assetID} already exists`);
        }

        // ==== Create asset object and marshal to JSON ====
        let asset = {
            assetID: assetID,
            firstname, lastname, address, dateOfBirth, idNumber, gender, status, approvalCount, owner, proofOfResidence, proofOfId
        };


        await ctx.stub.putState(assetID, Buffer.from(JSON.stringify(asset)));
        let indexName = 'kyc~name';
        let kycNameIndexKey = ctx.stub.createCompositeKey(indexName, [asset.idNumber, asset.assetID]);

        await ctx.stub.putState(kycNameIndexKey, Buffer.from('\u0000'));
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`Asset ${id} does not exist`);
        }

        return assetJSON.toString();
    }


    async UpdateAsset(ctx, assetName, status) {

        let assetAsBytes = await ctx.stub.getState(assetName);
        if (!assetAsBytes || !assetAsBytes.toString()) {
            throw new Error(`Asset ${assetName} does not exist`);
        }
        let assetToTransfer = {};
        try {
            assetToTransfer = JSON.parse(assetAsBytes.toString()); //unmarshal
        } catch (err) {
            let jsonResp = {};
            jsonResp.error = 'Failed to decode JSON of: ' + assetName;
            throw new Error(jsonResp);
        }
        assetToTransfer.status = status;

        let assetJSONasBytes = Buffer.from(JSON.stringify(assetToTransfer));
        await ctx.stub.putState(assetName, assetJSONasBytes); 
    }

    async GetAssetsByRange(ctx, startKey, endKey) {

        let resultsIterator = await ctx.stub.getStateByRange(startKey, endKey);
        let results = await this._GetAllResults(resultsIterator, false);

        return JSON.stringify(results);
    }


    async QueryAssetsByOwner(ctx, owner) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.owner = owner;
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    async QueryAssetsByStatus(ctx, status) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.status = status;
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    async QueryAssets(ctx, queryString) {
        return await this.GetQueryResultForQueryString(ctx, queryString);
    }

    async GetQueryResultForQueryString(ctx, queryString) {

        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        let results = await this._GetAllResults(resultsIterator, false);

        return JSON.stringify(results);
    }

    async GetAssetsByRangeWithPagination(ctx, startKey, endKey, pageSize, bookmark) {

        const {iterator, metadata} = await ctx.stub.getStateByRangeWithPagination(startKey, endKey, pageSize, bookmark);
        let results = {};

        results.results = await this._GetAllResults(iterator, false);

        results.ResponseMetadata = {
            RecordsCount: metadata.fetchedRecordsCount,
            Bookmark: metadata.bookmark,
        };

        return JSON.stringify(results);
    }

   
    async AssetExists(ctx, assetName) {
        // ==== Check if asset already exists ====
        let assetState = await ctx.stub.getState(assetName);
        return assetState && assetState.length > 0;
    }

    
    async _GetAllResults(iterator, isHistory) {
        let allResults = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));
                if (isHistory && isHistory === true) {
                    jsonRes.TxId = res.value.txId;
                    jsonRes.Timestamp = res.value.timestamp;
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            res = await iterator.next();
        }
        iterator.close();
        return allResults;
    }

    // InitLedger creates sample assets in the ledger
    async InitLedger(ctx) {
        const assets = [
            {
                assetID: 'asset1',
                firstname: 'John',
                lastname: 'Doe',
                dateOfBirth: '14/01/1980',
                gender: 'male',
                status: 'pending',
                idNumber: '1234456',
                approvalCount: 0,
                owner: '122121212', proofOfResidence:'kjkjkjkjkjk', proofOfId:'hghhg'
            },

        ];

        for (const asset of assets) {
            await this.CreateAsset(
                ctx,
                asset.assetID,
                asset.firstname,
                asset.lastname,
                asset.dateOfBirth,
                asset.gender,
                asset.status,
                asset.idNumber,
                asset.approvalCount,
                asset.owner,
                asset.proofOfResidence,
                asset.proofOfId
            );
        }
    }
}

module.exports = KyC;
