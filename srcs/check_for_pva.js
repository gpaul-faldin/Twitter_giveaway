/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const {phone_number} = require('./sms_wrapper.js')
const fs = require('fs');
const {parentPort} = require("worker_threads");
const mongoose = require('mongoose')
const cookies = require("./mongo/cookies.js")
const info = require("./mongo/twitter_info.js")
const user = require("./mongo/User.js")

mongoose.connect('mongodb://192.168.0.23:27017/Twitter');

/*
	THREADS
*/

parentPort.on("message", async (data) => {
	await check_pva(data.action, data.account, data.index)
	parentPort.postMessage("OK")
})

/*
	PUPPETEER
*/

puppeteer.use(StealthPlugin())

async function acc_fill(account) {
	account.info = await info.findOne({user: account.user}).then(nfo => nfo.info)
	account.cookies = await cookies.findOne({user: account.user}).then(nfo => nfo.cookies)
	return (account)
}

async function pva(page, user) {
	if (await page.$('input[value="Start"]'))
		await page.click('input[value="Start"]')
	await page.waitForTimeout(1000)
	if (await page.$('input[placeholder="Enter confirmation code"]'))
		await page.goto('https://twitter.com/account/access?lang=en&did_not_receive=true', { waitUntil: 'networkidle2' })
	await page.waitForTimeout(1000)
	let check_sus = await page.evaluate(`
		function verify() {
			if (document.querySelector("body > div.PageContainer > div > div.PageHeader.Edge")) {
				if (document.querySelector("body > div.PageContainer > div > div.PageHeader.Edge").innerHTML.includes("Verify your phone number")) {
					return (1)
				}
			}
			else {
				return (0)
			}
		}
		verify()
	`)
	if (check_sus == 1)
		return (2)
	await page.screenshot({ path: process.cwd() + `/debug_screenshot/${user}.jpg`})
	try {await page.waitForSelector('#country_code')}
	catch(e) {
		console.log(`${user} had funcaptcha`)
		return (1)
	}
	await page.select('#country_code', "84")
	let phone = new phone_number(10, 'tw', 2)
	await phone.get_number()
	await page.type('#phone_number', phone.nbr)
	await page.click('input[name="discoverable_by_mobile_phone"]')
	await page.waitForTimeout(500)
	await page.click('input[type="submit"]')
	await page.waitForTimeout(2000)
	if (await page.evaluate(`
		function timeout() {
			if (document.querySelector("body > div.PageContainer > div > a")) {
				if (document.querySelector("body > div.PageContainer > div > a").innerHTML === 'Try Again')
					return (1)
			}
			else {
				return (0)
			}
		}
		timeout()
	`) == 1) {
		await phone.set_status(8)
		return (3)
	}
	let code = await phone.get_code(user)
	if (code == "NONE")
		return (1)
	await page.type('#code', code)
	await page.waitForTimeout(2000)
	await page.click('input[value="Next"]')
	try {await page.waitForSelector('input[value="Continue to Twitter"]')}
	catch(e) {
		return (2)
	}
	await page.click('input[value="Continue to Twitter"]')
	await page.waitForTimeout(5000)
	//let cookie = await page.cookies()
	//fs.writeFileSync(process.cwd() + `/cookies/${user}_cookies.json`, JSON.stringify(cookie, null, 2), { flags: "w" });
	await page.waitForTimeout(2000)
}

async function check_pva(action, account, index) {

	var stop = false
	var suspended = false
	var timeout = false
	account = await acc_fill(account)
	const browser = await puppeteer.launch({
		headless: action.info.headless,
		args: [`--proxy-server=${account.proxy}`]
	});
	const page = await browser.newPage();

	page.on('pageerror', async (msg) => {
		if (msg.message.includes("HTTP-403 codes:[64]") == true) {
			suspended = true
		}
	})
	await page.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36`)
	await page.setViewport({ width: 1280, height: 720 })
	await page.setCookie(...account.cookies);
	await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' })
	await page.waitForTimeout(3000)
	if (await page.url() == "https://twitter.com/account/access") {
		console.log(`PVA for ${account.user}`)
		var status = await pva(page, account.user)
		if (status >= 1)
			stop = true
		if (status == 2)
			suspended = true
		else if (status == 3)
			timeout = true
	}
	if (suspended == true) {
		const acc = JSON.parse(fs.readFileSync(process.cwd() + `/db/acc.json`, 'utf8'))
		for (let x in acc) {
			if (acc[x].user == account.user) {
				index = x
				break ;
			}
		}
		acc[index].tag = "SUSPENDED"
		fs.writeFileSync(process.cwd() + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
		console.log(`${account.user} is suspended`)
	}
	if (timeout == true) {
		//const acc = JSON.parse(fs.readFileSync(process.cwd() + `/db/acc.json`, 'utf8'))
		// for (let x in acc) {
		// 	if (acc[x].user == account.user) {
		// 		index = x
		// 		break ;
		// 	}
		// }
		//acc[index].timeout = true
		//fs.writeFileSync(process.cwd() + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
		console.log(`${account.user} had too many phone for the day`)
	}
	await browser.close()
	return (0)
}
