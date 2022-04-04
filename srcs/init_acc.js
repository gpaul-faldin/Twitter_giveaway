/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const {picture, legit_at} = require('./banner-pp/index.js')
const {phone_number} = require('./sms_wrapper.js')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const fs = require('fs');
const {parentPort} = require("worker_threads");
const legit_json = require('../db/legit.json')


/*
	INIT
*/

const pic = new picture
const legit = new legit_at(legit_json)

/*
	THREADS
*/
parentPort.on("message", async (data) => {
	await init_twitter(data.account, data.index)
	parentPort.postMessage("OK")
})

/*
	PUPPETEER
*/

puppeteer.use(StealthPlugin())
puppeteer.use(RecaptchaPlugin({ provider: { id: '2captcha', token: '89f71b2cf02b35c6b5c1f8deb9f9161b' }, visualFeedback: true }))

async function cookie_str(user) {
	const cookiesString = fs.readFileSync(process.cwd() + `/cookies/${user}_cookies.json`);
	const cookies = JSON.parse(cookiesString);
	return (cookies)
}

async function delete_str_in_selec(page, selector) {
	await page.focus(selector);
	await page.keyboard.down('Control');
	await page.keyboard.press('A');
	await page.keyboard.up('Control');
	await page.keyboard.press('Backspace');
}

async function assign_img(page, user, name) {
	while (await page.$('input[name="displayName"]') == null)
		await page.waitForTimeout(500)
	try {const [pp_choose] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div[aria-label="Add avatar photo"]'),
	]);
		await pp_choose.accept([pic.get_pp(name)])
		await page.waitForSelector('div[data-testid="applyButton"]')
		await page.click('div[data-testid="applyButton"]')
	}
	catch(e) {
		console.log(`${user} error add Avatar photo`)
		await page.screenshot({ path: process.cwd() + `/debug_screenshot/${user}.jpg`})
	}
	await page.waitForTimeout(1000)
	const [banner_chooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div[aria-label="Add banner photo"]'),
	]);
	await banner_chooser.accept([pic.get_banner()])
	await page.waitForSelector('div[data-testid="applyButton"]')
	await page.click('div[data-testid="applyButton"]')
	await delete_str_in_selec(page, 'input[name="displayName"]')
	await delete_str_in_selec(page, 'input[name="displayName"]')
	await page.type('input[name="displayName"]', pic.get_name(name))
	await delete_str_in_selec(page, 'textarea[name="description"]')
	await delete_str_in_selec(page, 'textarea[name="description"]')
	await page.type('textarea[name="description"]', pic.get_bio())
	await page.waitForTimeout(2000)
	await page.click('div[data-testid="Profile_Save_Button"]')
	await page.waitForTimeout(4000)
	var name = await page.evaluate(`
		var name = document.querySelector('a[aria-label="Profile"]').href.split('/')[3]
		'@' + name
	`)
	return (name)
}

async function follow(page, user) {

	var arr = legit.give_arr()
	for (let x in arr) {
		var url = "https://twitter.com/" + arr[x]
		try {
			await page.goto(url, { waitUntil: 'networkidle2' })
			await page.waitForTimeout(1000)
			if (await page.$(`div[aria-label="Follow @${arr[x]}"]`) != null)
				await page.click(`div[aria-label="Follow @${arr[x]}"]`)
		}
		catch (e) {
			console.log(`error follow ${arr[x]} by ${user}`)
		}
	}
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
	if (fs.existsSync(process.cwd() + `/cookies/${account.user}_cookies.json`)) {
		await page.setCookie(... await cookie_str(account.user));
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
		await page.waitForTimeout(2000)
		console.log(`PVA for ${account.user}`)
		await browser.close()
		return (0)
	}
	try {await page.goto("https://twitter.com/settings/profile", { waitUntil: 'domcontentloaded' })}
	catch(e) {
		console.log(`${account.user} error while loading`)
	}
	await page.waitForTimeout(2000)
	if (suspended == false) {
		if (account.tag == "") {
			const acc = JSON.parse(fs.readFileSync(process.cwd() + `/db/acc.json`, 'utf8'))
			acc[index].tag = tag
			fs.writeFileSync(process.cwd() + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
		}
		var tag = await assign_img(page, account.user, account.tag.substring(1))
	}
	else {
		const acc = JSON.parse(fs.readFileSync(process.cwd() + `/db/acc.json`, 'utf8'))
		acc[index].tag = "SUSPENDED"
		fs.writeFileSync(process.cwd() + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
	}
	await follow(page, user)
	console.log(`${account.user} INIT OK`)
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