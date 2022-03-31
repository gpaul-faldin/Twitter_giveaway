const axios = require('axios').default

class phone_number {
	constructor(country, service, opt) {
		this.api_key = "d096b72Aec81876efebAf8104e98e1f6",
		this.url = "https://api.sms-activate.org/stubs/handler_api.php?",
		this.country = country,
		this.service = service
		this.action = [
			"getNumber",
			"setStatus",
			"getStatus"
		]
		this.id = ""
		this.nbr = ""
		this.opt = opt
		this.end = 0
	}
	async get_number() {
		try {
			const resp = await axios.get(this.url + `api_key=${this.api_key}&action=${this.action[0]}&service=${this.service}&country=${this.country}`)
			let tmp = resp.data.split(':')
			if (tmp[0] === "ACCESS_NUMBER") {
				this.id = tmp[1]
				this.nbr = tmp[2].substring(this.opt)
			}
			else if (resp.data == "NO_NUMBERS") {
				console.log(resp.data)
				await this.get_number(this.opt)
			}
			else
				console.log(resp.data)
		}
		catch(e){
			console.log(e)
		}
	}
	async set_status(status) {
		try {
			const resp = await axios.get(this.url + `api_key=${this.api_key}&action=${this.action[1]}&status=${status}&id=${this.id}`)
			return (resp.data)
		}
		catch(e){
			console.log(e)
		}
	}
	async get_status() {
		try {
			const resp = await axios.get(this.url + `api_key=${this.api_key}&action=${this.action[2]}&id=${this.id}`)
			if (String(resp.data).includes('STATUS_OK'))
				return (resp.data)
			else
				return ("NO")
		}
		catch(e){
			console.log(e)
		}
	}
	async get_code(user) {
		this.end = Date.now() + 600000
		await this.set_status(1)
		await this.sleep(10000)
		while (await this.get_status() === "NO" && Date.now() < this.end)
			await this.sleep(5000)
		let re = await this.get_status()
		console.log(`${user} code : ${re}`)
		if (re === "NO") {
			await this.set_status(8)
			return ("NONE")
		}
		await this.set_status(1)
		return (re)
	}
	async sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}

module.exports = {phone_number}