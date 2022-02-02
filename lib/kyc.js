/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class KyC extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const kyc = [
            {
                kycId: 1,
                address: '',
                dateOfBirth: '',
                gender: '',
                approval: 'pending',
                banks: [],
                owner: '',
                idDoument: '',
                proofOfResidenceDocument: ''
            }
        ];

        for (let i = 0; i < kyc.length; i++) {
            kyc[i].docType = 'kyc';
            await ctx.stub.putState('KYC' + i, Buffer.from(JSON.stringify(kyc[i])));
            console.info('Added <--> ', kyc[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryKYC(ctx, kycNumber) {
        const kycAsBytes = await ctx.stub.getState(kycNumber);

        if (!kycAsBytes || kycAsBytes.length === 0) {
            throw new Error(`${kycNumber} does not exist`);
        }
        console.log(kycAsBytes.toString());
        return kycAsBytes.toString();
    }

    async createKYC(ctx, kycNumber, kycId, address, dateOfBirth, gender, approval, banks, owner, idDoument, proofOfResidenceDocument) {
        console.info('============= START : Create Kyc ===========');

        const kyc = {
            kycId,
            address,
            dateOfBirth,
            gender,
            approval,
            banks,
            owner,
            idDoument,
            proofOfResidenceDocument
        }

        await ctx.stub.putState(kycNumber, Buffer.from(JSON.stringify(kyc)));
        console.info('============= END : Create kyc ===========');
    }

    async queryAllKyc(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async updateAprovalStatus(ctx, kycNumber, newStatus) {
        console.info('============= START : updateAprovalStatus ===========');

        const kycAsBytes = await ctx.stub.getState(kycNumber); 
        if (!kycAsBytes || kycAsBytes.length === 0) {
            throw new Error(`${kycAsBytes} does not exist`);
        }
        const kyc = JSON.parse(kycAsBytes.toString());
        kyc.approval = newStatus;

        await ctx.stub.putState(kycAsBytes, Buffer.from(JSON.stringify(kyc)));
        console.info('============= END : updateAprovalStatus ===========');
    }


}

module.exports = KyC;
