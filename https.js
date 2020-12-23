const fs = require("fs");
const path = require('path');

console.log(path.resolve(__dirname, '..', 'self-cert', "cert.pem"));

module.exports = {
    cert: fs.readFileSync(path.resolve(__dirname, '..', 'self-cert', "cert.pem")),
    key: fs.readFileSync(path.resolve(__dirname, '..', 'self-cert', "key.pem")),
    passphrase: "1234"
};
