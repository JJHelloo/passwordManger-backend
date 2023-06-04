const crypto = require('crypto');

const encrypt = (data, masterPassword) => {
  const salt = crypto.randomBytes(16).toString('hex');

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(masterPassword, salt, 100000, 32, 'sha512', (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-ctr', derivedKey, iv);

        let encryptedData = cipher.update(data, 'utf8', 'hex');
        encryptedData += cipher.final('hex');

        const encryptedObject = {
          salt,
          iv: iv.toString('hex'),
          data: encryptedData
        };

        resolve(encryptedObject);
      }
    });
  });
};

const decrypt = (encryption, masterPassword) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(masterPassword, encryption.salt, 100000, 32, 'sha512', (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        try {
          const decipher = crypto.createDecipheriv('aes-256-ctr', derivedKey, Buffer.from(encryption.iv, 'hex'));
          let decryptedData = decipher.update(encryption.data, 'hex', 'utf8');
          decryptedData += decipher.final('utf8');
          resolve(decryptedData);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
};


module.exports = { encrypt, decrypt };
