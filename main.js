const menubar = require('menubar')
const electron = require('electron')
const {app, BrowserWindow} = electron
const openpgp = require('openpgp')

// openpgp

var keyring = new openpgp.Keyring()

var key = require('./keys2.js');
var enc = ''
var pubkey = key.pub
var privkey = key.priv
var pubkey2 = key.pub2
var privkey2 = key.priv2
// console.log(pubkey)
var msg = "hola"

openpgp.initWorker({ path:'openpgp.worker.js' }) // set the relative web worker path
openpgp.config.aead_protect = true // activate fast AES-GCM mode (not yet OpenPGP standard)

// /openpgp

var tray = electron.Tray
var mb = menubar()
mb.setOption('index', `file://${__dirname}/index.html`)

mb.on('ready', function ready () {


     if (process.platform === "linux"){
       mb.tray.setToolTip('show app')
     }
  	console.log('app is ready')
  	// your app code here
})

app.on('ready', () => {
  let win = new BrowserWindow({width:800, height:600})
  win.loadURL(`file://${__dirname}/index.html`)
  win.webContents.openDevTools()
})

exports.openWindow = () => {
  let win = new BrowserWindow({width:400, height:200})
  win.loadURL(`file://${__dirname}/bear.html`)
}
exports.openVerifyWindow = () => {
  let win = new BrowserWindow({width:800, height:600})
  win.loadURL(`file://${__dirname}/verifyMsg.html`)
}
exports.encrypt = function(msg, publicKeyId){
	console.log('encrypt')

	var publicKey = keyring.publicKeys.getForId(publicKeyId)
	var options, encryptedMsg;

	options = {
	    data: msg, // input as Uint8Array (or String)
	    publicKeys: publicKey
	    // passwords: ['secret stuff']              // multiple passwords possible
	    // armor: false                              // don't ASCII armor (for Uint8Array output)
	};

	encryptedMsg = openpgp.encrypt(options).then(function(ciphertext) {
	    return ciphertext.data; // get raw encrypted packets as Uint8Array 
	});

	return encryptedMsg

}

exports.decrypt = function(msg, passphrase){
	console.log('decrypt')
	var privateKeys = keyring.privateKeys.keys
	var decryptedMsg;

	privateKeys.forEach(function(key){
		key.decrypt(passphrase)
		// console.log(key.primaryKey.getKeyId().toHex())
		options = {
		    message: openpgp.message.readArmored(msg),     // parse armored message
		    privateKey: key // for decryption
		};

		decryptedMsg = openpgp.decrypt(options).then(function(plaintext) {
		    key.encrypt(passphrase);

		    return {
		    	decryptedMsg: plaintext.data,
		    	error: null
		    } // 'Hello, World!'

		}, function (error) {
    		return {
    			decryptedMsg: msg,
    			error: error
    		}
		});

		
	})

	return decryptedMsg
}

exports.generate = function(){
	console.log('entre')
	var options = {
	    userIds: [{ name:'Jon papa', email:'jonpapa@example.com' }], // multiple user IDs
	    numBits: 1024,                                            // RSA key size
	    passphrase: 'jon'         // protects the private key
	};

	openpgp.generateKey(options).then(function(key) {
	    var privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
	    var pubkey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
	    console.log('yei')
	    console.log(privkey)
	    console.log(pubkey)
	});

}

//||||||||||||||||||||PRELIMINAR TESTING OF THE SIGNING FUNCTION (not working)
// // Sign function  ..........................................//
// options= {
//   data: "hola",
//   privateKeys: openpgp.key.readArmored(privkey2).keys[0],
//   armor: true
// };
// // console.log(privkey2)
// // console.log(options.privateKeys)
// // console.log(typeof(options.privateKeys))
// // var testKey = openpgp.key.readArmored(privkey2).keys[0]
// // console.log(openpgp.decryptKey(testKey,"jon"))
// openpgp.sign(options).then(function(signed){
//   console.log("signing in main")
//   console.log(signed.data)
//   return signed.data
// });

//This is the function that takes care of signing
//messages using the privatekey
exports.Sign = function(msg, privateKey){
  console.log("signing")

  options ={//variable containing the options for the signing function
    data: "hola", // message to be signed
    privateKeys: openpgp.key.readArmored(privkey2).keys, //read the key from armor
    armor: true // true if you want ascii armored, false for message object
    // armor: false
  };
  console.log(options.privateKeys[0].decrypt('jon')) //aparently the way to decrypt private keys

  //random debugging messages
  console.log("/////////////after the test/////////////")
  console.log(options.privateKeys)

//|||||||||||||||ACTUALLY DOING THE SIGNING OF THE MESSAGE
  openpgp.sign(options).then(function(signedMessage){//where the magic happens
    console.log('before signing') // random debug comment
    console.log(signedMessage.data) // random debug comment (to se the actuall result of the function)
    console.log('after signing')//random debug comment
    // msg = signedMessage.data // using this value for the Verify function
    return signedMessage.data
  });
}


// console.log(openpgp.message.readArmored(sigmsg))
// function sign_message()
//   sigmsg = sign_message(pubkey2, privkey2, "jon", "hello")
//   console.log(sigmsg)

exports.getPublicKeys = function(){
	// key = openpgp.key.readArmored(pubkey).keys[0]
	// console.log(key.primaryKey.getFingerprint());
	// console.log(key.primaryKey.created);
	// console.log(key.primaryKey.getKeyId().toHex())


    var publicKeys = keyring.publicKeys.keys

	 // var localstore = null;
	 // var pgpKeyring = new openpgp.Keyring(localstore);
	 // // console.log(key.getUserIds()[0])
	 // // console.log(pgpKeyring.publicKeys)
	 // pgpKeyring.publicKeys.importKey(pubkey)
	 // console.log('dsps')
	 // console.log(pgpKeyring.getAllKeys())
	 // pgpKeyring.store()
	return publicKeys
}

exports.openWindow = function(name, devTools){
	let win = new BrowserWindow({width:400, height:400})
	win.loadURL(`file://${__dirname}/`+name)
	
	if (devTools) {
		win.webContents.openDevTools()
	};
}

exports.importKey = function(key){
	console.log('importKey');
	armored = openpgp.key.readArmored(key).keys[0]
	if (armored.isPublic()) {
		keyring.publicKeys.importKey(key)
	}
	else if(armored.isPrivate()){
		keyring.privateKeys.importKey(key)
	}
	// armored = openpgp.key.readArmored(key).keys[0]
	// console.log(armored.isPublic())
	// keyring.publicKeys.importKey(publicKey)
	keyring.store()

	// Esto te imprime todos los id de los public key que están guardados

	// keyring.publicKeys.keys.forEach(function(k){
	// 	console.log(k.primaryKey.getKeyId().toHex())
	// })
}

//|||||||||||||Verify function
// var message = openpgp.message.readArmored(key.sigmsg)
// console.log(openpgp.cleartext.readArmored(key.sigmsg).packets[0].issuerKeyId)
// console.log(key.sigmsg)
exports.Verify= function (msg, publicKey){
  console.log("verifying")
  // console.log(openpgp.key.readArmored(publicKey).keys)

  options = {
    publicKeys: openpgp.key.readArmored(publicKey).keys,
    message: openpgp.cleartext.readArmored(msg)
    // publicKeys: openpgp.key.readArmored(pubkey2).keys,
    // message: openpgp.cleartext.readArmored(key.sigmsg)
  }
  // console.log(options.publicKeys)
  // console.log(key.sigmsg)
  // console.log(options.message)
  var ver = openpgp.verify(options).then(function(verified){
    // console.log("before")//debuggin message
    // console.log(verified.data)//debuggin message
    console.log(verified)//basically a dictionary containing the message, keyid and valid (boolean)
    console.log(verified.signatures[0].valid)//acces the boolean that tells you if its a valid signature
    console.log(verified.signatures[0].keyid)//acces the keyid for the key used to sign the message
    // console.log('data:')//debuggin message
    // console.log(verified.data)//debuggin message
    // console.log('signatures: ')//debuggin message
    // console.log(verified.signatures.valid)//debuggin message
    // console.log(verified.signatures.keyid)//debuggin message
    console.log("after")
    return verified
  })
  return ver ;
}
