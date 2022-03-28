/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
var Chance = require('chance')
const axios = require('axios').default
const {parentPort} = require("worker_threads");

/*
	THREADS
*/
parentPort.on("message", async (data) => {
	await log_in_twitter(data.action, data.account, data.array)
	parentPort.postMessage("OK")
})

/*
	CLASS
*/

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
			else if (resp.date == "NO_NUMBERS") {
				console.log(resp.date)
				await this.get_number(this.opt)
			}
			else
				console.log(resp.date)
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
			return (resp.data)
		}
		catch(e){
			console.log(e)
		}
	}
	async get_code() {
		this.end = Date.now() + 600000
		await this.set_status(1)
		await this.sleep(10000)
		while (await this.get_status() === "STATUS_WAIT_CODE" && Date.now() < this.end)
			await this.sleep(5000)
		let re = await this.get_status()
		if (re === "STATUS_WAIT_CODE") {
			await this.set_status(8)
			return (0)
		}
		return (re)
	}
	async sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}

/*
	PUPPETEER
*/

puppeteer.use(StealthPlugin())

async function action_todo(action, page, user, array) {
	if (action.like == true && action.url != '') {
		if (await page.$('div[aria-label="Like"]'))
			await page.click('div[aria-label="Like"]')
		await page.waitForTimeout(2000)
	}
	if (action.rt == true && action.url != '') {
		if (await page.$('div[aria-label="Retweet"]')) {
			await page.waitForTimeout(200)
			await page.click('div[aria-label="Retweet"]')
			await page.waitForTimeout(500)
			//await page.screenshot({ path: __dirname + `/debug_screenshot/${user}.jpg`})
			await page.click('div[data-testid="retweetConfirm"]')
			await page.waitForTimeout(2000)
		}
	}
	if (action.tag.on == true && action.url != '') {
		while (await page.$('div[data-testid="reply"]') == null);
			await page.waitForTimeout(50)
		await page.click('div[data-testid="reply"]')
		while (await page.$('div[data-testid="tweetTextarea_0"]') == null);
			await page.waitForTimeout(50)
		await page.type('div[data-testid="tweetTextarea_0"]', get_random_at(user, action.tag.nbr, array))
		await page.waitForTimeout(500)
		await page.screenshot({ path: `${user}.png` });
		await page.click('div[data-testid="tweetButton"]')
		await page.click('div[data-testid="tweetButton"]')
		await page.waitForTimeout(2000)
	}
	if (action.follow.on == true) {
		for (let i in action.follow.acc) {
			if (action.follow.acc[i] != user) {
				let url = "https://twitter.com/" + action.follow.acc[i].substring(1)
				await page.waitForTimeout(1000)
				await page.goto(url, { waitUntil: 'networkidle2' });
				await page.waitForTimeout(1000)
				if (await page.$(`div[aria-label="Follow ${action.follow.acc[i]}"]`) != null)
					await page.click(`div[aria-label="Follow ${action.follow.acc[i]}"]`)
			}
		}
	}
	console.log(`${user} OK`)
}

async function pva(page, user) {
	if (await page.$('input[value="Start"]'))
		await page.click('input[value="Start"]')
	await page.waitForSelector('#country_code')
	await page.select('#country_code', "84")
	let phone = new phone_number(10, 'tw', 2)
	await phone.get_number()
	await page.type('#phone_number', phone.nbr)
	await page.click('input[name="discoverable_by_mobile_phone"]')
	await page.waitForTimeout(500)
	await page.click('input[type="submit"]')
	let code = await phone.get_code()
	console.log(user + ": " + code)
	if (code == "NONE")
		return (1)
	await page.type('#code', code)
	await page.waitForTimeout(2000)
	await page.click('input[value="Next"]')
	await page.waitForSelector('input[value="Continue to Twitter"]')
	await page.click('input[value="Continue to Twitter"]')
	await page.waitForTimeout(5000)
}

async function log_in_twitter(action, account, array) {
	var stop = false
	const browser = await puppeteer.launch({
		headless: action.info.headless,
		args: [`--proxy-server=${account.proxy}`]
	});
	const page = await browser.newPage();
	await page.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36`)
	await page.setViewport({ width: 1280, height: 720 })
	const cookiesString = fs.readFileSync(__dirname + `/cookies/${account.user}_cookies.json`);
	const cookies = JSON.parse(cookiesString);
	await page.setCookie(...cookies);
	await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' })
	if (await page.url() == "https://twitter.com/account/access") {
		await page.waitForTimeout(5000)
		console.log(`PVA for ${account.user}`)
		if (await pva(page, account.user) == 1)
			stop = true
	}
	if (stop == false) {
		if (action.url != '') {
			await page.goto(action.url, { waitUntil: 'networkidle2' })
			await page.waitForTimeout(2000)
		}
		await action_todo(action, page, account.user, array)
	}
	await browser.close()
	return (0)
}

/*
	UTILS
*/

var chance = new Chance();

	//////TWITTER//////
function get_random_at(user, nbr, array) {

	var re = "";
	var i = 0;
	var mem = [];

	while (i < nbr) {
		let tmp = -1;
		while (tmp == -1) {
			tmp = chance.integer({ min: 0, max: (array.length - 1) })
			if (array[tmp].user == user || mem.indexOf(tmp) != -1 || array[tmp].tag == undefined)
				tmp = -1
		}
		mem.push(tmp)
		re = re.length == 0 ? re.concat(array[tmp].tag) : re.concat(" " + array[tmp].tag)
		i++;
	}
	return (re)
}