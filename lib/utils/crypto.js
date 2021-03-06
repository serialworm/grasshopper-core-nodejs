(function(){

    'use strict';

    var crypto = {},
        config = require('../config').crypto,
        CryptoJS = require('crypto-js'),
        AES = require('crypto-js/aes'),
        passphrase= config.secret_passphrase,
        JsonFormatter = {
            stringify: function (cipherParams) {
                // create json object with ciphertext
                var jsonObj = {
                    ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
                };

                // optionally add iv and salt
                if (cipherParams.iv) {
                    jsonObj.iv = cipherParams.iv.toString();
                }
                if (cipherParams.salt) {
                    jsonObj.s = cipherParams.salt.toString();
                }

                // stringify json object
                return JSON.stringify(jsonObj);
            },

            parse: function (jsonStr) {
                // parse json string
                var jsonObj = JSON.parse(jsonStr),
                    cipherParams = CryptoJS.lib.CipherParams.create({
                    ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
                });

                // optionally extract iv and salt
                if (jsonObj.iv) {
                    cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
                }
                if (jsonObj.s) {
                    cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
                }

                return cipherParams;
            }
        };

    crypto.createSalt = function () {
        return Math.round(new Date().valueOf() * Math.random()) + '';
    };

    crypto.createHash = function(plainText, salt){
        return CryptoJS.HmacSHA256(plainText, salt);
    };

    crypto.encrypt = function(value){
        return AES.encrypt(value, passphrase, { format: JsonFormatter }).toString();
    };

    crypto.decrypt = function(value){
        var decrypted = (AES.decrypt(value, passphrase, { format: JsonFormatter }));
        return decrypted.toString(CryptoJS.enc.Utf8);
    };

    module.exports = crypto;
})();

