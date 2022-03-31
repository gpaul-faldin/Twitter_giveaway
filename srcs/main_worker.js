/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
var Chance = require('chance')
const {phone_number} = require('./sms_wrapper.js')
const {parentPort} = require("worker_threads");

/*
	THREADS
*/
parentPort.on("message", async (data) => {
	await log_in_twitter(data.action, data.account, data.array, data.index)
	parentPort.postMessage("OK")
})

/*
	PUPPETEER
*/

puppeteer.use(StealthPlugin())

async function cookie_str(user) {
	const cookiesString = fs.readFileSync(process.cwd() + `/cookies/${user}_cookies.json`);
	const cookies = JSON.parse(cookiesString);
	return (cookies)
}

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
		await page.screenshot({ path: __dirname + `/debug_screenshot/${user}.jpg` });
		await page.click('div[data-testid="tweetButton"]')
		await page.click('div[data-testid="tweetButton"]')
		await page.waitForTimeout(2000)
	}
	if (action.follow.on == true) {
		for (let i in action.follow.acc) {
			if (action.follow.acc[i] != user) {
				let url = "https://twitter.com/" + action.follow.acc[i]
				await page.waitForTimeout(1000)
				await page.goto(url, { waitUntil: 'networkidle2' });
				await page.waitForTimeout(1000)
				if (await page.$(`div[aria-label="Follow @${action.follow.acc[i]}"]`) != null)
					await page.click(`div[aria-label="Follow @${action.follow.acc[i]}"]`)
			}
		}
	}
	console.log(`${user} OK`)
}

async function pva(page, user) {
	if (await page.$('input[value="Start"]'))
		await page.click('input[value="Start"]')
	await page.waitForTimeout(1000)
	if (await page.$('input[placeholder="Enter confirmation code"]'))
		await page.goto('https://twitter.com/account/access?lang=en&did_not_receive=true')
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
		return (1)
	}
	let code = await phone.get_code(user)
	if (code == "NONE")
		return (1)
	await page.type('#code', code)
	await page.waitForTimeout(2000)
	await page.click('input[value="Next"]')
	await page.waitForSelector('input[value="Continue to Twitter"]')
	await page.click('input[value="Continue to Twitter"]')
	await page.waitForTimeout(5000)
	let cookie = await page.cookies()
	fs.writeFileSync(process.cwd() + `/cookies/${user}_cookies.json`, JSON.stringify(cookie, null, 2), { flags: "w" });
	await page.waitForTimeout(2000)
}

async function log_in_twitter(action, account, array, index) {
	var stop = false
	var suspended = false
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
	await page.setCookie(... await cookie_str(account.user));
	await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' })
	await page.waitForTimeout(5000)
	if (await page.url() == "https://twitter.com/account/access") {
		console.log(`PVA for ${account.user}`)
		if (await pva(page, account.user) == 1)
			stop = true
		else
			await page.setCookie(... await cookie_str(account.user));
	}
	if (stop == false && suspended == false) {
		if (action.url != '') {
			await page.goto(action.url, { waitUntil: 'networkidle2' })
			await page.waitForTimeout(2000)
		}
		await action_todo(action, page, account.user, array)
	}
	else if (suspended == true) {
		const acc = JSON.parse(fs.readFileSync(process.cwd() + `/db/acc.json`, 'utf8'))
		acc[index].tag = "SUSPENDED"
		fs.writeFileSync(process.cwd() + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
		console.log(`${account.user} is suspended`)
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