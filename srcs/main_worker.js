/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
var Chance = require('chance')
const {phone_number} = require('./sms_wrapper.js')
const {parentPort} = require("worker_threads");
const mongoose = require('mongoose')
const cookies = require("./../mongo/cookies.js")
const info = require("./../mongo/twitter_info.js")
const user = require("./../mongo/User.js")

mongoose.connect('mongodb://192.168.0.23:27017/Twitter');

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

async function acc_fill(account) {
	account.info = await info.findOne({user: account.user}).then(nfo => nfo.info)
	account.cookies = await cookies.findOne({user: account.user}).then(nfo => nfo.cookies)
	return (account)
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
		await page.waitForTimeout(2000)
		await page.evaluate(`
			var tmp = document.querySelectorAll('span')
			function swag() {
				for (let x in tmp) {
					if (tmp[x].innerHTML == 'Got it')
						return (tmp[x])
				}
				return ('')
			}
			function res() {
				var re = swag()
				if (re.length != 0)
					re.parentNode.parentNode.parentNode.click()
				return (0)
			}
			res()
		`)
		while (await page.$('div[data-testid="tweetTextarea_0"]') == null);
		await page.waitForTimeout(500)
		await page.type('div[data-testid="tweetTextarea_0"]', get_random_at(user, action.tag.nbr, array))
		await page.waitForTimeout(500)
		await page.click('div[data-testid="tweetButton"]')
		await page.click('div[data-testid="tweetButton"]')
		await page.waitForTimeout(2000)
	}
	if (action.follow.on == true) {
		for (let i in action.follow.acc) {
			if (action.follow.acc[i] != user) {
				let url = "https://twitter.com/" + action.follow.acc[i][0] == '@' ? action.follow.acc[i].substring(1) : action.follow.acc[i]
				await page.waitForTimeout(1000)
				try {
					await page.goto(url, { waitUntil: 'networkidle2'})
					await page.waitForTimeout(1000)
					var acc = action.follow.acc[i][0] == '@' ? action.follow.acc[i] : '@' + action.follow.acc[i]
					if (await page.$(`div[aria-label="Follow @${acc}"]`) != null)
						await page.click(`div[aria-label="Follow @${acc}"]`)
					}
				catch (e) {
					console.log(`error follow ${acc} by ${user}`)
				}
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
	try {
		await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' })
	}
	catch (e) {
		console.log(`${account.user} failed to go /home`)
		await page.screenshot({ path: process.cwd() + `/debug_screenshot/${account.user}_ERROR.jpg`})
		await browser.close()
		return (0)
	}
	await page.waitForTimeout(3000)
	await page.screenshot({ path: process.cwd() + `/debug_screenshot/${account.user}_TEST.jpg`})
	if (await page.url() == "https://twitter.com/account/access") {
		console.log(`PVA for ${account.user}`)
		stop = true
	}
	if (stop == false && suspended == false) {
		if (action.url != '') {
			await page.goto(action.url, { waitUntil: 'networkidle2' })
			await page.waitForTimeout(2000)
		}
		await action_todo(action, page, account.user, array)
	}
	else if (suspended == true) {

		await cookies.deleteOne({user: account.user})
		await info.deleteOne({user: account.user})
		await user.deleteOne({user: account.user})
		// const acc = JSON.parse(fs.readFileSync(process.cwd() + `/db/acc.json`, 'utf8'))
		// acc[index].tag = "SUSPENDED"
		// fs.writeFileSync(process.cwd() + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
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
	var index = 0

	for (let x in array) {
		if (array[x].user == user)
			index = x
	}
	var arr = array[index].info.followers.arr

	while (i < nbr) {
		var tmp = chance.integer({ min: 0, max: (arr.length - 1) })
		if (mem.includes(arr[tmp]) == false) {
			re = re.length == 0 ? re.concat(arr[tmp]) : re.concat(" " + arr[tmp])
			mem.push(arr[tmp])
			i++
		}
	}
	return (re)
}