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
				return (1)
		}
		catch(e){
			console.log(e)
		}
	}
	async get_code() {
		this.end = Date.now() + 600000
		await this.set_status(1)
		await this.sleep(10000)
		while (await this.get_status() === 1 && Date.now() < this.end)
			await this.sleep(5000)
		let re = await this.get_status()
		if (re === 1) {
			return ("NONE")
		}
		await this.set_status(6)
		return (re)
	}
	async sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}

module.exports = {phone_number}