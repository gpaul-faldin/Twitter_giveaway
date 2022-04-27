const axios = require('axios').default
const path = require('path');
const fs = require('fs')
require("dotenv").config();

async function get_pp(name) {

	const response = await axios({
		method: 'GET',
		url: `http://pro-fill.faldin.xyz/api/profile-pic?name=${name}`,
		responseType: 'stream',
		headers: {
			"Authorization": "Bearer " + process.env.PRO_FILL
		}
	})
	const path = "srcs/img/" + response.headers.img_id + ".jpg"
	response.data.pipe(fs.createWriteStream(path))
	return (path)
}

async function get_bio () {
	const response = await axios({
		method: 'GET',
		url: `http://pro-fill.faldin.xyz/api/bio`,
		headers: {
			"Authorization": "Bearer " + process.env.PRO_FILL
		}
	})
	return (response.data)
}

async function get_banner() {
	const response = await axios({
		method: 'GET',
		url: `http://pro-fill.faldin.xyz/api/banner-pic`,
		responseType: 'stream',
		headers: {
			"Authorization": "Bearer " + process.env.PRO_FILL
		}
	})
	const path = "srcs/img/" + response.headers.img_id + ".jpg"
	response.data.pipe(fs.createWriteStream(path))
	return (path)
}

async function get_legit() {
	const response = await axios({
		method: 'GET',
		url: `http://pro-fill.faldin.xyz/api/legit-tag`,
		headers: {
			"Authorization": "Bearer " + process.env.PRO_FILL
		}
	})
	console.log(response.data)
	return (response.data)
}

async function rm_img(path) {
	fs.unlinkSync(path)
}

function get_name(user) {
	var re = ""
	for(let i in user) {
		if ((/^[a-zA-Z]+$/.test(user[i]) && i == 0) || (/^[a-z]+$/.test(user[i])))
			re += user[i]
		else
			break ;
	}
	return (re)
}

module.exports = {
	get_pp,
	get_banner,
	rm_img,
	get_bio,
	get_legit,
	get_name
}