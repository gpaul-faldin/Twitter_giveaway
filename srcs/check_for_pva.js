/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const {phone_number} = require('./wrapper/sms_wrapper.js')
const fs = require('fs');
const {parentPort} = require("worker_threads");
const mongoose = require('mongoose')
const cookies = require("./mongo/cookies.js")
const info = require("./mongo/twitter_info.js")
const User = require("./mongo/User.js")
const capt = require("./wrapper/2captcha_wrapper.js")
require("dotenv").config();

mongoose.connect('mongodb://192.168.0.23:27017/Twitter');

/*
	INIT
*/
var captcha = new capt(process.env.CAPTCHA_KEY, "0152B4EB-D2DC-460A-89A1-629838B529C9", "https://twitter.com/account/access")

/*
	THREADS
*/

parentPort.on("message", async (data) => {
	await check_pva(data.account, data.index)
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
	if (await page.$('a[href="https://support.twitter.com/articles/18311"]') != null) {
		console.log(`Account timeout ${user}`)
		if (await page.$('input[value="Continue to Twitter"]'))
			await page.click('input[value="Continue to Twitter"]')
		await User.updateOne(
			{ user: user },
			{
				$set: {
					timeout: true,
					end_timeout: Date.now() + (86400000 * 3)
				}
			}
		)
		return (0)
	}
	console.log(`PVA for ${user}`)
	if (await page.$('input[value="Continue to Twitter"]'))
		await page.click('input[value="Continue to Twitter"]')
	await page.screenshot({ path: process.cwd() + `/debug_screenshot/${user}_PVA.jpg`})
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
	if (await page.$("#arkose_iframe")) {
		var resp = ""
		while (resp == "")
			resp = await captcha.get_code()
		await page.evaluate(`
			var Token = \"${resp}\"
			var enc = document.getElementById('arkose_iframe')
			var encWin = enc.contentWindow || enc
			var encDoc = enc.contentDocument || encWin.document
			let script = encDoc.createElement('SCRIPT')
			script.append('function SubmitCaptcha(token) { parent.postMessage(JSON.stringify({ eventId: "challenge-complete", payload: { sessionToken: token } }), "*") }')
			encDoc.documentElement.appendChild(script)
			encWin.SubmitCaptcha(Token)
		`)
	}
	await page.screenshot({ path: process.cwd() + `/debug_screenshot/${user}_PVA.jpg`})
	try {await page.waitForSelector('#country_code')}
	catch(e) {
		await page.screenshot({ path: process.cwd() + `/debug_screenshot/${user}_ERRPVA.jpg`})
		console.log(`${user} had funcaptcha`)
		return (1)
	}
	await page.select('#country_code', "91")
	let phone = new phone_number(22, 'tw', 2)
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
	await page.screenshot({ path: process.cwd() + `/debug_screenshot/${user}_PVA.jpg`})
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
	await page.waitForTimeout(2000)
}

async function check_pva(account, index) {

	var stop = false
	var suspended = false
	var timeout = false
	account = await acc_fill(account)
	const browser = await puppeteer.launch({
		headless: true,
		args: [
			`--proxy-server=${account.proxy}`,
			"--disable-web-security",
			"--disable-site-isolation-trials",
			"--disable-application-cache",
			'--disable-features=IsolateOrigins,site-per-process'
		]
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
		// if (await page.$('input[value="Continue to Twitter"]')) {
		// 	console.log(`${account.user} is timeout`)
		// 	await page.click('input[value="Continue to Twitter"]')
		// 	await page.waitForTimeout(2000)
		// 	await user.updateOne({user: account.user}, {$set: {timeout: true, end_timeout: Date.now() + (3 * 86400000)}})
		// 	await browser.close()
		// 	return (0)
		// }
		var status = await pva(page, account.tag)
		if (status >= 1)
			stop = true
		if (status == 2)
			suspended = true
		else if (status == 3)
			timeout = true
	}
	if (suspended == true) {
		console.log(account.tag, "Is suspended")
		// const acc = JSON.parse(fs.readFileSync(process.cwd() + `/db/acc.json`, 'utf8'))
		// for (let x in acc) {
		// 	if (acc[x].user == account.user) {
		// 		index = x
		// 		break ;
		// 	}
		// }
		// acc[index].tag = "SUSPENDED"
		// fs.writeFileSync(process.cwd() + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
		// console.log(`${account.user} is suspended`)
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
