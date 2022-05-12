/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const {parentPort} = require("worker_threads");
const cookies = require("./mongo/cookies.js")
const info = require("./mongo/twitter_info.js")
const cp_acc = require("./mongo/copy_accounts.js")
const user = require("./mongo/User.js")
const axios = require("axios").default
const mongoose = require('mongoose');
const twit = require('./twitter_class.js')
const {get_legit} = require('./wrapper/pro-fill_wrapper.js');



/*
	INIT
*/

mongoose.connect('mongodb://192.168.0.23:27017/Twitter');


/*
	THREADS
*/
parentPort.on("message", async (data) => {
	var copy = await get_profile()
	console.log(data.account.user)
	if (await init_twitter_pptr(data.account, copy) == 0) {
		await update_profile(data.account, copy)
		if (data.account.ini_follow == true)
			await follow_acc(account)
		else
			await user.updateOne({ user: data.account.user },
			{
				$set: {
					ini: false,
				}
			})
	}
	parentPort.postMessage("OK")
})


/*
	ASSIGN LEGIT PROFILE
*/
async function get_profile() {
	var re = cp_acc.aggregate([
		{
			$match: {used: false}
		},
		{
			$sample: { size: 1 }
		}
	]).then((x) => { return x[0] })
	return (re)
}

/*
	PUPPETEER
*/

puppeteer.use(StealthPlugin())
puppeteer.use(RecaptchaPlugin({ provider: { id: '2captcha', token: '89f71b2cf02b35c6b5c1f8deb9f9161b' }, visualFeedback: true }))

async function acc_fill(account) {
	account.info = await info.findOne({ user: account.user }).then(nfo => nfo.info)
	await user.updateOne({ user: account.user }, {$set: {referTo: await info.findOne({ user: account.user })}})
	try {
		account.cookies = await cookies.findOne({ user: account.user }).then(nfo => nfo.cookies)
	} catch (e) {}
	return (account)
}

async function delete_str_in_selec(page, selector) {
	await page.focus(selector);
	await page.keyboard.down('Control');
	await page.keyboard.press('A');
	await page.keyboard.up('Control');
	await page.keyboard.press('Backspace');
}

async function init_twitter_pptr(account, legit) {
	var suspended = false
	var stop = false
	account = await acc_fill(account)
	const browser = await puppeteer.launch({
		headless: true,
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
	if (account.cookies.length !== 0) {
		await page.setCookie(...account.cookies);
	}
	else {
		await page.goto('https://twitter.com/i/flow/login', { waitUntil: 'networkidle2' });
		while (await page.$('input[autocomplete="username"]') == null)
			await page.waitForTimeout(50)
		await page.type('input[autocomplete="username"]', account.user)
		await page.evaluate(`document.querySelectorAll('div[role="button"]')[2].click()`)
		await page.waitForTimeout(1000)
		while (await page.$('div[data-testid="OCF_CallToAction_Button"]') == null)
			await page.waitForTimeout(50)
		await page.click('div[data-testid="OCF_CallToAction_Button"]')
		try {
			await page.solveRecaptchas()
			await page.waitForSelector('input[name="password"]', {timeout: 0})
			await page.type('input[name="password"]', account.pass)
			await page.waitForTimeout(1000)
			await page.click('div[data-testid="LoginForm_Login_Button"]')
		}
		catch(e) {
			stop = true
		}
		if (suspended == false && stop == false) {
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
			var req_cookie = []
			for (let x in cookie) {
				let str = cookie[x].name + '=' + cookie[x].value
				if (cookie[x].name === 'ct0')
					var crsf = cookie[x].value
				req_cookie.push(str)
			}
			await cookies.create({
				user: account.user,
				cookies: cookie,
				crsf: crsf,
				req_cookie: req_cookie
			})
		}
	}
	if (await page.url() == "https://twitter.com/account/access") {
		await page.waitForTimeout(2000)
		console.log(`PVA for ${account.user}`)
		await browser.close()
		return (0)
	}
	try {
		await page.goto("https://twitter.com/settings/your_twitter_data/account", { waitUntil: 'networkidle2', timeout: 0})
	} catch(e) {
		console.log(`${account.user} error while loading profile settings`)
		stop = true
		suspended = true
		}
	await page.waitForTimeout(2000)
	if (suspended == false && stop == false) {
		try {
			await page.type('input[name="current_password"]', account.pass)
			await page.evaluate(`
			function click_confirm() {
				var tmp = document.querySelectorAll('span')
				for (let x in tmp) {
					if (tmp[x].innerHTML == "Confirm") {
						tmp[x].parentNode.parentNode.parentNode.click()
						break ;
					}
				}
			}
			click_confirm()
		`)
			while (await page.$('a[href="/settings/screen_name"]') == null)
				await page.waitForTimeout(100)
			await page.click('a[href="/settings/screen_name"]')
			while (await page.$('input[name="typedScreenName"]') == null)
				await page.waitForTimeout(100)
			await delete_str_in_selec(page, 'input[name="typedScreenName"]')
			await page.type('input[name="typedScreenName"]', legit.tag)
			await page.waitForTimeout(1000)
			await page.evaluate(`
			document.querySelectorAll('h2[aria-level="2"]')[2].parentElement.parentElement.children[3].firstChild.click()
			`)
			await page.waitForTimeout(1500)
			await page.click('div[data-testid="settingsDetailSave"]')
			while (await page.$('a[href="/settings/screen_name"]') == null)
				await page.waitForTimeout(100)
			account.tag = await page.evaluate(`
			document.querySelector('a[href="/settings/screen_name"]').firstChild.firstChild.lastChild.firstChild.innerHTML
		`)
		} catch (e) {
			stop = true
		}
	}
	else if (suspended == true) {
		await axios.delete(`http://twitter.faldin.xyz/api/delete/account?user=${account.user}`)
	}
	if (stop || suspended) {
		console.log(`${account.user} NOT OK`)
		await browser.close()
		return (1)
	}
	else {
		await user.updateOne({ user: account.user },
			{
				$set: {
					cookies: await cookies.findOne({ user: account.user }),
					tag: account.tag,
				}
			})
	}
	await browser.close()
	return (0)
}

/*
	INIT FOLLOW
*/

async function follow_acc (account) {

	account.cookies = await cookies.findOne({ user: account.user })
	var twitter = new twit(account.cookies.req_cookie, account.cookies.crsf, account.proxy.split(':'), "0")
	const legit = await get_legit()
	var prom = []
	for (let x = 0; x < legit.length; x++) {
		prom.push(twitter.follow(legit[x]))
	}
	await Promise.all(prom)
	await user.updateOne({ user: account.user },
		{
			$set: {
				ini: false,
			}
		})
	return (0)
}

/*
	CHANGE: BIO/PROFILE/BANNER
*/

async function update_profile(account, copy) {
	account.cookies = await cookies.findOne({ user: account.user })
	var twitter = new twit(account.cookies.req_cookie, account.cookies.crsf, account.proxy.split(':'), "0")
	await twitter.change_username_bio(copy.username, copy.bio)
	await twitter.update_banner_image(account.tag, copy._id)
	await twitter.update_image(account.tag, copy._id)
	await user.updateOne({user: account.user},
		{
			$set: {
				copy_of: await cp_acc.findOne({user_id: copy.user_id})
			}
		})
	await cp_acc.updateOne({tag: copy.tag}, {$set: {used: true}})
	console.log(`${account.user} INIT OK`)
	return (0)
}
