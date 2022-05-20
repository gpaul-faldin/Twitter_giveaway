const axios = require('axios').default

class captcha2 {
	constructor (key, pubkey, pageurl) {
		this.url_req = "http://2captcha.com/in.php"
		this.url_get = "http://2captcha.com/res.php"
		this.params_req = {
			key: key,
			method: "funcaptcha",
			publickey: pubkey,
			surl: "https://client-api.arkoselabs.com",
			pageurl: pageurl,
			json: 1
		}
		this.get = {
			key: key,
			action: "get",
			id: "",
			json: 1
		}
	}
	async get_code() {
		var re = ""
		this.get.id = await axios.post(this.url_req, this.params_req).then((x) => {
			return(x.data.request)
		})
		await this.sleep(10000)
		while (re.length == 0) {
			try {
				let web = await axios.post(this.url_get + `?key=${this.get.key}&action=${this.get.action}&id=${this.get.id}&json=1`)
				if (web.data.status == 1)
					return(web.data.request)
				else if (web.data.request == "ERROR_CAPTCHA_UNSOLVABLE")
					return (re)
				else
					await this.sleep(5000)
				}
				catch(e) {await this.sleep(5000)}
			
		}
		return (re)
	}
	sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}

module.exports = captcha2