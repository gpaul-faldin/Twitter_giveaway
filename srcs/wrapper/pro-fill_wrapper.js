const axios = require('axios').default
const path = require('path');
const fs = require('fs')
require("dotenv").config();

async function get_pp(name, base64) {

	const response = await axios({
		method: 'GET',
		url: `http://pro-fill.faldin.xyz/api/profile-pic?name=${name}&base64=${base64}`,
		responseType: base64 == true ? 'text': 'stream',
		headers: {
			"Authorization": "Bearer " + process.env.PRO_FILL
		}
	})
	if (base64 == true) {
		return (response.data)
	}
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

async function get_banner(base64) {
	const response = await axios({
		method: 'GET',
		url: `http://pro-fill.faldin.xyz/api/banner-pic?base64=${base64}`,
		responseType: base64 == true ? 'text': 'stream',
		headers: {
			"Authorization": "Bearer " + process.env.PRO_FILL
		}
	})
	if (base64 == true) {
		return (response.data)
	}
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
	return (response.data)
}

async function add_banner(user_id, base64_img) {
	const response = await axios({
		method: 'POST',
		url: `http://pro-fill.faldin.xyz/api/add/banner`,
		headers: {
			"Authorization": "Bearer " + process.env.PRO_FILL
		},
		data: {
			id: user_id,
			base64: base64_img
		}
	})
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
	get_name,
	add_banner
}