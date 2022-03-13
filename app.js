/*
	REQUIRE
*/
const express = require('express')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
var Chance = require('chance');
const fs = require('fs');


/*
	INIT
*/

	//////CLASS//////

class	proxy_stat {
	constructor(proxy) {
		this.proxy = proxy,
		this.state = 0,
		this.used = 0,
		this.max = 0
	}
	status() {
		if (this.state)
			this.state = 0
		else {
			this.state = 1
			this.used++
		}
	}
	max_use() {
		if (this.max != 0) {
			if (this.used == this.max)
				return (1);
			return (0);
		}
		return (0);
	}
}
class	accounts {
	constructor(log) {
		this.user = log[0],
		this.pass = log[1]
		this.tag = log[2]
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

var proxies = create_proxy_array()
var acc = create_acc_array()
var action = new actions
action.url = "https://twitter.com/NetflixFR/status/1501981460621844488"
action.rt = false
action.like = false
action.handler_follow(["@Tot_SamiyNFT", "@KingArthurrNFT", "@nftbadger", "@PoorApes_"])
//action.handler_tag(1)

function	create_proxy_array() {
	let proxy = fs.readFileSync("./db/proxy.txt", 'utf8')
	let re = new Array

	proxy = proxy.split('\r')
	for (let x in proxy) {
		proxy[x] = proxy[x].trim()
		if (proxy[x])
		re.push(new proxy_stat(proxy[x]))
	}
	return (re);
}
function	create_acc_array() {
	let acc = fs.readFileSync("./db/accounts.txt", 'utf8')
	let re = new Array

	acc = acc.split('\r')
	for (let x in acc) {
		acc[x] = acc[x].trim()
		if (acc[x])
			re.push(new accounts(acc[x].split(':')))
	}
	return (re);
}

	//////MISC//////
puppeteer.use(StealthPlugin())
var chance = new Chance();

/*
	PUPPETEER
*/

function give_proxy()
{
	for (let i in proxies)
	{
		if (proxies[i].state == 0 && proxies[i].max_use() == 0)
		{
			proxies[i].status()
			return (proxies[i].proxy)
		}
	}
}

async function login_gmail(page, account) {

	await page.waitForSelector("#identifierId")
	await page.type("#identifierId", account.user)
	var url = await page.mainFrame().url()
	await page.click("#identifierNext > div > button")
	await page.waitForTimeout(2000)
	if (await page.mainFrame().url() == url)
		return (1)
	await page.type('#password', account.pass)
	url = await page.mainFrame().url()
	await page.click("#passwordNext")
	await page.waitForTimeout(2000)
	if (await page.mainFrame().url() == url)
			return (1)
}

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
			await page.goto(url, {waitUntil: 'networkidle2'});
			if (await page.$(`div[aria-label="Follow ${action.follow.acc[i]}"]`) != null)
				await page.click(`div[aria-label="Follow ${action.follow.acc[i]}"]`)
		}
	}
}

async function test_img(page, browser) {

	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div[aria-label="Add avatar photo"]'),
	]);
	await fileChooser.accept(['C:/Users/paul9/Desktop/IMAGE DISCORD/sasuke.jpg'])
	await page.waitForSelector('div[data-testid="applyButton"]')
	await page.click('div[data-testid="applyButton"]')
	await page.waitForSelector('div[data-testid="Profile_Save_Button"]')
	await page.click('div[data-testid="Profile_Save_Button"]'),
	await page.waitForTimeout(2000)
}

async function log_in_twitter(action, account) {
	const browser = await puppeteer.launch({
		headless: true//,
		//timeout: 9999999
	});
	const page = await browser.newPage();
	await page.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36`)
	await page.setViewport({ width: 800, height: 600 })
	await page.goto('https://twitter.com/i/flow/login', {waitUntil: 'networkidle0'});
	await page.frames()[1].click("#container > div")
	const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
	const popup = await newPagePromise;
	await popup.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36`)
	await popup.reload()
	if (await login_gmail(popup, account) == 1) {
		console.log("ERROR WITH MAIL")
		await browser.close()
	}
	else {
		await page.waitForSelector("#react-root")
		await page.goto(action.url, {waitUntil: 'networkidle2'})
		await page.goto("https://twitter.com/settings/profile", {waitUntil: 'networkidle2'})
		await test_img(page, browser)
		//await action_todo(action, page, account.user)
		await browser.close()
	}
	//browser.close()
}

log_in_twitter(action, acc[0]);



/*
	UTILS
*/
	//////TWITTER//////
function get_random_at(user, nbr) {

	var re = "";
	var i = 0;
	var mem = [];

	while (i < nbr) {
		let tmp = -1;
		while (tmp == -1) {
			tmp = chance.integer({min: 0, max :(acc.length - 1)})
			if (acc[tmp].user == user || mem.indexOf(tmp) != -1 || acc[tmp].tag == undei)
				tmp = -1
		}
		mem.push(tmp)
		re = re.length == 0 ? re.concat(acc[tmp].tag) : re.concat(" " + acc[tmp].tag)
		i++;
	}
	return (re)
}

	//////MISC//////
function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

var print = 0
function print_step() {
	print++
	return ("STEP: " + print)
}