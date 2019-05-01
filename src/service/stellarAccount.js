import StellarSdk from 'stellar-sdk';
import { AES, enc } from 'crypto-js';
import { getAdmin } from '../routes/admin';

const ENVCryptoSecret = 'Stellar-is-awesome';

if (process.env.NETWORK == 'TESTNET') {
    console.log("TESTNET");
    var stellarServer = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    StellarSdk.Network.useTestNetwork();
} else {
    console.log("Main net");
    var stellarServer = new StellarSdk.Server('https://horizon.stellar.org');
    StellarSdk.Network.usePublicNetwork()
}


export const createAccount = async () => {
    return new Promise(async (resolve, reject) => {
        const keypair = StellarSdk.Keypair.random();

        const secret = AES.encrypt(
            keypair.secret(),
            ENVCryptoSecret
        ).toString()

        const data = {
            stellarAddress: keypair.publicKey(),
            stellarSeed: secret
        }

        await createAccountInLedger(keypair.publicKey());

        console.log('acc', data);
        resolve(data);
    })
}

export const createAccountInLedger = async (newAccount) => {
    return new Promise(async (resolve, reject) => {
       
            //const admin = await getAdmin();
            console.log("New account");
            console.log(newAccount);
            //console.log("Admin Seed ", admin.stellarSeed);

            //const provisionerKeyPair = StellarSdk.Keypair.fromSecret(AES.decrypt(admin.stellarSeed, ENVCryptoSecret).toString(enc.Utf8));
            const provisionerKeyPair = StellarSdk.Keypair.fromSecret(process.env.FUND_PRIVATE);
            const provisioner = await stellarServer.loadAccount(provisionerKeyPair.publicKey());
            console.log('creating account in ledger', newAccount)

            const transaction = new StellarSdk.TransactionBuilder(provisioner)
                .addOperation(
                    StellarSdk.Operation.createAccount({
                        destination: newAccount,
                        startingBalance: '1'
                    })
                ).build()

            transaction.sign(provisionerKeyPair)

            const result = await stellarServer.submitTransaction(transaction);
            console.log('Account created: ', result)
            resolve(result);
        
    })
}


export const payment = async (signerKeys, destination, amount) => {

    const account = await stellarServer.loadAccount(signerKeys.publicKey())

    let transaction = new StellarSdk.TransactionBuilder(account)
        .addOperation(
            StellarSdk.Operation.payment({
                destination,
                asset: StellarSdk.Asset.native(),
                amount: amount
            })
        )
        .build()

    transaction.sign(signerKeys)

    console.log(`sending ${amount} from ${signerKeys.publicKey()} to ${destination} `)
    try {
        const result = await stellarServer.submitTransaction(transaction)
        console.log(`sent ${result}`)
        return result
    } catch (e) {
        console.log(`failure ${e}`)
        throw e
    }
}

export const getAccount = (id) => {
    console.log('called');
    console.log(id);
    return stellarServer.accounts()
        .accountId(id)
        .call()
        .then((response) => {
            console.log('res', response);
            return response;
        })
        .catch((error) => {
            console.log('error', error);
            throw error
        })
}   