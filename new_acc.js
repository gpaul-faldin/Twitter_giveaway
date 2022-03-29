/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const pic = require('./banner-pp/index.js').gen
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const fs = require('fs');
const {parentPort} = require("worker_threads");

const picture = new pic

/*
	THREADS
*/
parentPort.on("message", async (data) => {
	await init_twitter(data.account, data.index)
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
puppeteer.use(RecaptchaPlugin({ provider: { id: '2captcha', token: '89f71b2cf02b35c6b5c1f8deb9f9161b' }, visualFeedback: true }))

async function assign_img(page, user) {
	try {const [pp_choose] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div[aria-label="Add avatar photo"]'),
	]);
	await pp_choose.accept([picture.get_pp()])
	}
	catch(e) {
		console.log(`${user} error add Avatar photo`)
		await page.screenshot({ path: __dirname + `/debug_screenshot/${user}.jpg`})
	}
	await page.waitForSelector('div[data-testid="applyButton"]')
	await page.click('div[data-testid="applyButton"]')
	await page.waitForTimeout(1000)
	const [banner_chooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div[aria-label="Add banner photo"]'),
	]);
	await banner_chooser.accept([picture.get_banner()])
	await page.waitForSelector('div[data-testid="applyButton"]')
	await page.click('div[data-testid="applyButton"]')
	await page.click('input[name="displayName"]', {clickCount: 3})
	await page.type('input[name="displayName"]', picture.get_name())
	await page.click('textarea[name="description"]', { clickCount: 3 })
	await page.type('textarea[name="description"]', picture.get_bio())
	await page.waitForTimeout(2000)
	await page.click('div[data-testid="Profile_Save_Button"]')
	await page.waitForTimeout(4000)
	var name = await page.evaluate(`
		var name = document.querySelector('a[aria-label="Profile"]').href.split('/')[3]
		'@' + name
	`)
	return (name)
}

async function init_twitter(account, index) {
	var suspended = false
	const browser = await puppeteer.launch({
		headless: false,
		args: [`--proxy-server=${account.proxy}`]
	});
	const page = await browser.newPage();
	page.on('pageerror', async (msg) => {
		if (msg.message.includes("HTTP-403 codes:[64]") == true) {
			suspended = true
		}
	})
	await page.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36`)
	await page.setViewport({ width: 800, height: 600 })
	if (fs.existsSync(__dirname + `/cookies/${account.user}_cookies.json`)) {
		const cookiesString = fs.readFileSync(__dirname + `/cookies/${account.user}_cookies.json`);
		const cookies = JSON.parse(cookiesString);
		await page.setCookie(...cookies);
		await page.waitForTimeout(2000)
	}
	else {
		await page.goto('https://twitter.com/i/flow/login', { waitUntil: 'networkidle0' });
		await page.type('input[autocomplete="username"]', account.user)
		await page.evaluate(`document.querySelectorAll('div[role="button"]')[2].click()`)
		await page.waitForTimeout(1000)
		await page.click('div[data-testid="OCF_CallToAction_Button"]')
		await page.solveRecaptchas()
		await page.waitForSelector('input[name="password"]', {timeout: 0})
		await page.type('input[name="password"]', account.pass)
		await page.waitForTimeout(1000)
		await page.click('div[data-testid="LoginForm_Login_Button"]')
		if (suspended == false) {
			await page.waitForTimeout(2000)
			if (await page.$('input[type="email"]')) {
				await page.type('input[type="email"]', account.mail)
				await page.evaluate(`
					document.querySelectorAll('div[role="button"]')[1].click()
				`)
			}
			await page.waitForTimeout(10000)
			await page.evaluate(`
				function accept_cookies() {
					var selectors = document.querySelectorAll('span')
						for (let i in selectors) {
							if (selectors[i].innerHTML === 'Accept all cookies') {
								selectors[i].parentElement.parentElement.parentElement.click()
								break;
							}
						}
				}
				accept_cookies()
			`)
			let cookie = await page.cookies()
			fs.writeFileSync(__dirname + `/cookies/${account.user}_cookies.json`, JSON.stringify(cookie, null, 2), { flags: "w" });
		}
	}
	if (await page.url() == "https://twitter.com/account/access") {
		await page.waitForTimeout(5000)
		console.log(`PVA for ${account.user}`)
		if (await pva(page, account.user) == 1)
			suspended = true
	}
	await page.goto("https://twitter.com/settings/profile", { waitUntil: 'networkidle2' })
	await page.waitForTimeout(2000)
	if (suspended == false) {
		var tag = await assign_img(page, account.user)
		if (account.tag == "") {
			const acc = JSON.parse(fs.readFileSync(__dirname + `/db/acc.json`, 'utf8'))
			acc[index].tag = tag
			fs.writeFileSync(__dirname + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
		}
	}
	else {
		const acc = JSON.parse(fs.readFileSync(__dirname + `/db/acc.json`, 'utf8'))
		acc[index].tag = "SUSPENDED"
		fs.writeFileSync(__dirname + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
	}
	await browser.close()
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