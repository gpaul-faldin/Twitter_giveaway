const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
var Chance = require('chance')
const {parentPort} = require("worker_threads");

/*
	THREADS
*/
parentPort.on("message", async (data) => {
	await log_in_twitter(data.action, data.account)
	parentPort.postMessage("OK")
})

/*
	PUPPETEER
*/

puppeteer.use(StealthPlugin())

async function action_todo(action, page, user) {
	if (action.like == true) {
		await page.click('div[aria-label="Like"')
	}
	if (action.rt == true) {
		await page.click('div[aria-label="Retweet"]')
		await page.click('div[data-testid="retweetConfirm"]')
	}
	if (action.tag.on == true) {
		await page.click('div[data-testid="reply"]')
		while (await page.$('div[data-testid="tweetTextarea_0"]') == null);
		await sleep(50)
		await page.type('div[data-testid="tweetTextarea_0"]', get_random_at(user, action.tag.nbr))
		await page.click('div[data-testid="tweetButton"]')
		await page.click('div[data-testid="tweetButton"]')
	}
	if (action.follow.on == true) {
		for (let i in action.follow.acc) {
			let url = "https://twitter.com/" + action.follow.acc[i].substring(1)
			await page.goto(url, { waitUntil: 'networkidle2' });
			await page.waitForTimeout(1000)
			if (await page.$(`div[aria-label="Follow ${action.follow.acc[i]}"]`) != null)
				await page.click(`div[aria-label="Follow ${action.follow.acc[i]}"]`)
		}
	}
}

async function log_in_twitter(action, account) {
	const browser = await puppeteer.launch({
		headless: false,
		args: [`--proxy-server=${account.proxy}`]
	});
	const page = await browser.newPage();
	await page.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36`)
	await page.setViewport({ width: 800, height: 600 })
	await page.goto('https://twitter.com/i/flow/login', { waitUntil: 'networkidle0' });
	const cookiesString = fs.readFileSync(`./db/${account.user}_cookies.json`);
	const cookies = JSON.parse(cookiesString);
	await page.setCookie(...cookies);
	await page.waitForTimeout(2000)
	await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' })
	//await twitter_signin(page, account.user, account.pass)
	await page.waitForSelector("#react-root")
	await page.goto(action.url, { waitUntil: 'networkidle2' })
	await page.waitForTimeout(1000)
	await action_todo(action, page, account.user)
	await browser.close()
	return (0)
}

/*
	UTILS
*/

var chance = new Chance();

	//////TWITTER//////
function get_random_at(user, nbr) {

	var re = "";
	var i = 0;
	var mem = [];

	while (i < nbr) {
		let tmp = -1;
		while (tmp == -1) {
			tmp = chance.integer({ min: 0, max: (acc.length - 1) })
			if (acc[tmp].user == user || mem.indexOf(tmp) != -1 || acc[tmp].tag == undefined)
				tmp = -1
		}
		mem.push(tmp)
		re = re.length == 0 ? re.concat(acc[tmp].tag) : re.concat(" " + acc[tmp].tag)
		i++;
	}
	return (re)
}