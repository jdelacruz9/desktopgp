const remote = require('electron').remote
const main = remote.require('./main.js')

// var button = document.createElement('button')
// button.addEventListener('click', () => {
//   main.openWindow()
// }, false)
// button.textContent = 'Open Window'
// document.body.appendChild(button)

function signFunc(){
	main.openWindow()
}


function encryptFunc(){
	main.encrypt('msg', 'publicKey')
}

function decryptFunc(){
	main.Decrypt('msg', 'privateKey')
}

function signFunc(){
	main.Sign('msg', 'privateKey')
}

function verifyFunc() {
	main.Verify('msg', 'publicKey')

}
