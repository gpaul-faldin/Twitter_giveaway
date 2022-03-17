/*
	REQUIRE
*/
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const { ImapFlow } = require('imapflow');
var Chance = require('chance');
const {StaticPool} = require("node-worker-threads-pool");
const fs = require('fs');


/*
	INIT
*/

	//////CLASS//////

class	accounts {
	constructor(log, size) {
		this.user = log[0],
		this.pass = log[1]
		this.tag = log[2]
		this.proxy = log[3]
		this.size = size
	}
}
class	actions {
	constructor() {
		this.url = "",
		this.rt = false,
		this.like = false,
		this.tag = {
			'on' : false,
			'nbr' : 0
		},
		this.follow = {
			'on' : false,
			'acc': []
		}
		this.thread = 1
	}
	handler_tag(nbr) {
		this.tag.on = true,
		this.tag.nbr = nbr
	}
	handler_follow(acc) {
		this.follow.on = true,
		this.follow.acc = acc
	}
}

	//////PROXIES/ACCOUNTS/ACTIONS//////

var acc = create_acc_array()
var action = new actions
action.url = "https://twitter.com/riotgames/status/1504126412927942657"
action.rt = false
action.like = true
//action.handler_follow(["@Tot_SamiyNFT", "@KingArthurrNFT", "@nftbadger", "@PoorApes_"])
//action.handler_tag(1)

function	create_acc_array() {
	let acc = fs.readFileSync(__dirname + "/db/accounts.txt", 'utf8')
	let re = new Array
	var size = 0

	acc = acc.split('\n')
	for(let i in acc)
		size = i
	for (let x in acc) {
		acc[x] = acc[x].trim()
		if (acc[x])
			re.push(new accounts(acc[x].split(':'), size))
	}
	return (re);
}

	//////MISC//////
//var chance = new Chance();
//puppeteer.use(StealthPlugin())
//puppeteer.use(RecaptchaPlugin({ provider: { id: '2captcha', token: '89f71b2cf02b35c6b5c1f8deb9f9161b' }, visualFeedback: true }))

/*
	HANDLER
*/

async function main_handler() {
	var i = 0
	var prom = []
	const pool = new StaticPool({
		size: action.thread,
		task: "./worker.js"
	});
	while (i < acc[0].size) {
		prom.push(pool.exec({action: action, account: acc[i]}))
		i++;
	}
	await Promise.all(prom)
	process.exit()
}

main_handler()

/*
	PUPPETEER
*/

// async function action_todo(action, page, user) {
// 	if (action.like == true) {
// 		await page.click('div[aria-label="Like"')
// 	}
// 	if (action.rt == true) {
// 		await page.click('div[aria-label="Retweet"]')
// 		await page.click('div[data-testid="retweetConfirm"]')
// 	}
// 	if (action.tag.on == true) {
// 		await page.click('div[data-testid="reply"]')
// 		while (await page.$('div[data-testid="tweetTextarea_0"]') == null);
// 			await sleep(50)
// 		await page.type('div[data-testid="tweetTextarea_0"]', get_random_at(user, action.tag.nbr))
// 		await page.click('div[data-testid="tweetButton"]')
// 		await page.click('div[data-testid="tweetButton"]')
// 	}
// 	if (action.follow.on == true) {
// 		for (let i in action.follow.acc) {
// 			let url = "https://twitter.com/" + action.follow.acc[i].substring(1)
// 			await page.goto(url, {waitUntil: 'networkidle2'});
// 			await page.waitForTimeout(1000)
// 			if (await page.$(`div[aria-label="Follow ${action.follow.acc[i]}"]`) != null)
// 				await page.click(`div[aria-label="Follow ${action.follow.acc[i]}"]`)
// 		}
// 	}
// }

// async function log_in_twitter(action, account) {
// 	const browser = await puppeteer.launch({
// 		headless: false,
// 		args: [`--proxy-server=${account.proxy}`]
// 	});
// 	const page = await browser.newPage();
// 	await page.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36`)
// 	await page.setViewport({ width: 800, height: 600 })
// 	await page.goto('https://twitter.com/i/flow/login', {waitUntil: 'networkidle0'});
// 	const cookiesString = fs.readFileSync(`./db/${account.user}_cookies.json`);
// 	const cookies = JSON.parse(cookiesString);
// 	await page.setCookie(...cookies);
// 	await page.waitForTimeout(2000)
// 	await page.goto('https://twitter.com/home', {waitUntil: 'networkidle2'})
// 	//await twitter_signin(page, account.user, account.pass)
// 	await page.waitForSelector("#react-root")
// 	await page.goto(action.url, {waitUntil: 'networkidle2'})
// 	await page.waitForTimeout(1000)
// 	await action_todo(action, page, account.user)
// 	await browser.close()
// 	return (0)
// }


//log_in_twitter(action, acc[0]);

/*
	IMAP
*/

// function new_imap(mail, pass) {
// 	var re = new ImapFlow({
// 		host: 'outlook.office365.com',
// 		port: 993,
// 		secure: true,
// 		auth: {
// 			user: mail,
// 			pass: pass
// 		},
// 		logger: false
// 	})
// 	return (re)
// }

// async function check_mail(imap) {
// 	var re = ""
// 	await sleep(5000)
// 	await imap.connect();
// 	let mailbox = await imap.mailboxOpen('INBOX');

// 	while (re == "") {
// 		for await (let msg of imap.fetch({from: "verify@twitter.com"}, {envelope: true, source: true})){
// 			if (msg.envelope.subject.includes("Security alert: new or unusual Twitter login")) {
// 				re = msg.source.toString().split('\n')[158];
// 			}
// 		}
// 	}
// 	console.log(re)
// 	await imap.close();
// 	return (re)
// }

/*
	UTILS
*/
	//////TWITTER//////

// function get_random_at(user, nbr) {

// 	var re = "";
// 	var i = 0;
// 	var mem = [];

// 	while (i < nbr) {
// 		let tmp = -1;
// 		while (tmp == -1) {
// 			tmp = chance.integer({min: 0, max :(acc.length - 1)})
// 			if (acc[tmp].user == user || mem.indexOf(tmp) != -1 || acc[tmp].tag == undefined)
// 				tmp = -1
// 		}
// 		mem.push(tmp)
// 		re = re.length == 0 ? re.concat(acc[tmp].tag) : re.concat(" " + acc[tmp].tag)
// 		i++;
// 	}
// 	return (re)
// }

	//////MISC//////
// function sleep(ms) {
// 	return new Promise((resolve) => {
// 		setTimeout(resolve, ms);
// 	});
// }
