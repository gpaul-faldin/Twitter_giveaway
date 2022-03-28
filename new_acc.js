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
	PUPPETEER
*/

puppeteer.use(StealthPlugin())
puppeteer.use(RecaptchaPlugin({ provider: { id: '2captcha', token: '89f71b2cf02b35c6b5c1f8deb9f9161b' }, visualFeedback: true }))

async function assign_img(page) {
	const [pp_choose] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div[aria-label="Add avatar photo"]'),
	]);
	await pp_choose.accept([picture.get_pp()])
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
			await page.waitForNavigation({ timeout: 0, waitUntil: 'networkidle2' })
			await page.waitForTimeout(10000)
			let cookie = await page.cookies()
			fs.writeFileSync(__dirname + `/cookies/${account.user}_cookies.json`, JSON.stringify(cookie, null, 2), { flags: "w" });
		}
	}
	await page.goto("https://twitter.com/settings/profile", { waitUntil: 'networkidle2' })
	await page.waitForTimeout(2000)
	if (suspended == false) {
		var tag = await assign_img(page)
		if (account.tag == "") {
			const acc = JSON.parse(fs.readFileSync(__dirname + `/db/acc.json`, 'utf8'))
			acc[index].tag = tag
			fs.writeFileSync(__dirname + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
		}
	}
	else {
		const acc = require(__dirname + "/db/acc.json")
		acc[index].tag = "SUSPENDED"
		fs.writeFileSync(__dirname + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
	}
	await browser.close()
}
