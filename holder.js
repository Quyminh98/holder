const web3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const { AccountLayout } = require('@solana/spl-token');
const fs = require("fs")
const filePath = './holder.json';

const url = "https://billowing-burned-darkness.solana-mainnet.quiknode.pro/d209116502969b71adffbb9bb36f5f1e6e407d79/";
const connection = new web3.Connection(url);

const getListHolder = async (tokenMint, amount, decimals) => {

    const listHolder = await connection.getProgramAccounts(new web3.PublicKey(splToken.TOKEN_PROGRAM_ID),
        {
            filters: [
                {
                    dataSize: 165,
                },
                {
                    memcmp: {
                        offset: 0,
                        bytes: tokenMint
                    }
                }
            ],
        }
    )
    let result = []
    for (let i = 0; i < listHolder.length; i++) {
        const accountDataBuffer = Buffer.from(listHolder[i].account.data, 'base64');
        const accountInfo = AccountLayout.decode(accountDataBuffer);
        const amountAccount = accountInfo.amount;
        const view = new DataView(amountAccount.buffer, amountAccount.byteOffset, amountAccount.byteLength);
        const balance = view.getBigUint64(0, true);
        if (balance >= BigInt(amount * 10 ** decimals)) {
            result.push(new web3.PublicKey(accountInfo.owner).toString())
        }
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            fs.writeFile(filePath, JSON.stringify(result, null, 2), (err) => {
                if (err) throw err;
                console.log("Data saved!");
            })
        } else {
            const currentData = JSON.parse(data)
            const newData = [...currentData, ...result]
            fs.writeFile(filePath, JSON.stringify(newData, null, 2), (err) => {
                if (err) throw err;
                console.log('Data added!');
            });
        }
    })
    // console.log(result.slice(0, 5));
    console.log(result.length);

    return result;
};

// getListHolder("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", 250000, 5); // BONK 160,949
// getListHolder("EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", 5, 6); // WIF 53,718
// getListHolder("HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4", 30, 9); // MYRO 31,398
// getListHolder("WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk", 45000, 5); // WEN 144,816 ---> 390,881

const filterBalance = async () => {
    fs.readFile(filePath, async (err, data) => {
        let result = []
        if (err) {
            throw err
        } else {
            // console.log(data);
            const currentData = JSON.parse(data)
            for (let i = 0; i < currentData.length; i++) {
                let balance = await connection.getBalance(new web3.PublicKey(currentData[i]));
                if (balance > 0.05) {
                    result.push(currentData[i])
                }
            }

            fs.writeFile(filePath, JSON.stringify(result, null, 2), (err) => {
                if (err) throw err;
                console.log('Data updated!');
            });
            console.log(result.length);
            return result;
        }
    })

}

filterBalance()