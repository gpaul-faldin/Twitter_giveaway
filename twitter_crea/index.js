/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const pic = require('../banner-pp/index.js').picture
const chance = require('chance').Chance()
const axios = require('axios').default
const { ImapFlow } = require('imapflow');
const fs = require('fs')

/*
	INIT
*/

	///////CLASS///////

class	proxy_stat {
	constructor(proxy, size) {
		this.proxy = proxy,
		this.state = 0,
		this.used = 0,
		this.max = 0
		this.size = size
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

class rand {
	gen_month() {
		return (chance.integer({min: 1, max: 12}))
	}
	gen_day() {
		return (chance.integer({min: 1, max: 28}))
	}
	gen_year() {
		return (chance.integer({min: 1985, max: 2003}))
	}
	gen_name() {
		return (chance.name({nationality: 'en'}))
	}
	gen_number(min, max) {
		return (chance.integer({min: min, max: max}))
	}
	async gen_bio() {
		try {
			const resp = await axios.get("https://www.twitterbiogenerator.com/generate")
			return (resp.data)
		}
		catch(e) {
			console.log(e)
		}
	}
}

class phone_number {
	constructor(country, service, opt) {
		this.api_key = "d096b72Aec81876efebAf8104e98e1f6",
		this.url = "https://api.sms-activate.org/stubs/handler_api.php?",
		this.country = country,
		this.service = service
		this.action = [
			"getNumber",
			"setStatus",
			"getStatus"
		]
		this.id = ""
		this.nbr = ""
		this.opt = opt
		this.end = 0
	}
	async get_number() {
		try {
			const resp = await axios.get(this.url + `api_key=${this.api_key}&action=${this.action[0]}&service=${this.service}&country=${this.country}`)
			let tmp = resp.data.split(':')
			if (tmp[0] === "ACCESS_NUMBER") {
				this.id = tmp[1]
				this.nbr = tmp[2].substring(this.opt)
			}
			else if (resp.date == "NO_NUMBERS") {
				console.log(resp.date)
				await this.get_number(this.opt)
			}
			else
				console.log(resp.date)
		}
		catch(e){
			console.log(e)
		}
	}
	async set_status(status) {
		try {
			const resp = await axios.get(this.url + `api_key=${this.api_key}&action=${this.action[1]}&status=${status}&id=${this.id}`)
			return (resp.data)
		}
		catch(e){
			console.log(e)
		}
	}
	async get_status() {
		try {
			const resp = await axios.get(this.url + `api_key=${this.api_key}&action=${this.action[2]}&id=${this.id}`)
			return (resp.data)
		}
		catch(e){
			console.log(e)
		}
	}
	async get_code() {
		this.end = Date.now() + 600000
		await this.set_status(1)
		while (await this.get_status() === "STATUS_WAIT_CODE" && Date.now() < this.end)
			await sleep(5000)
		let re = await this.get_status()
		if (re === "STATUS_WAIT_CODE") {
			await this.set_status(8)
			return (0)
		}
		return (re)
	}
}

class add_new {
	constructor() {
		this.path = "../db/accounts.txt"
	}
	add(mail,pass,tag, proxy) {
		let re = `${mail}:${pass}:${tag}:${proxy}\n`
		let content = fs.readFileSync(this.path, {encoding: 'utf8'})
		if (content.includes(mail) == false)
			fs.appendFileSync(this.path, re)
	}
}

	//////MISC//////

puppeteer.use(StealthPlugin())
//puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

const picture = new pic
const random = new rand
const acc = new add_new
const proxies = create_proxy_array()
/*
	PUPPETEER
*/

function give_proxy()
{
	var tmp = proxies[random.gen_number(0, (proxies[0].size - 1))]
	while (tmp.state != 0 && tmp.max_use() != 0)
		tmp = proxies[random.gen_number(0, proxies[0].size)]
	tmp.status()
	return (tmp.proxy)
}

async function init_twitter(page, email, pass) {
	await page.waitForSelector('select[id="SELECTOR_1"]')
	await page.type('input[name="name"]', random.gen_name())
	await page.evaluate(`document.querySelectorAll('div[role="button"]')[1].click()`)
	await page.waitForSelector('input[name="email"]')
	await page.type('input[name="email"]', email)
	await page.select('select[id="SELECTOR_1"]', String(random.gen_month()))
	await page.select('select[id="SELECTOR_2"]', String(random.gen_day()))
	await page.select('select[id="SELECTOR_3"]', String(random.gen_year()))
	await page.waitForTimeout(2000)
	await page.click('div[data-testid="ocfSignupNextLink"]')
	await page.evaluate(`document.querySelectorAll('div[role="button"]')[1].click()`)
	try {
		await page.click('div[data-testid="ocfSignupReviewNextLink"]')
	}
	catch(e) {
		return (1)
	}
	await page.type('input[name="verfication_code"]', await check_mail(new_imap(email, pass)))
	await page.evaluate(`document.querySelectorAll('div[role="button"]')[1].click()`)
	await page.waitForTimeout(1000)
	if (await page.$('input[name="phone_number"]') != null) {
		let phone = new phone_number(10, 'tw', 2)
		await phone.get_number()
		await page.type('input[name="phone_number"]', phone.nbr)
		await page.select(`#SELECTOR_4`, "FR")
		await page.waitForTimeout(1000)
		await page.evaluate(`document.querySelectorAll('div[role="button"]')[2].click()`)
		await page.waitForSelector('div[data-testid="confirmationSheetConfirm"]')
		await page.click('div[data-testid="confirmationSheetConfirm"]')
		let code = await phone.get_code()
		if (code == "0")
			return (1)
		await page.type('input[autocomplete="one-time-code"]', code)
		await page.waitForTimeout(1000)
		await page.click('div[data-testid="ocfPhoneVerificationNextLink"]')
		//await page.waitForTimeout(120000)
	}
	await page.waitForSelector('input[type="password"]')
	await page.type('input[type="password"]', pass)
	await page.waitForTimeout(1000)
	await page.click('div[data-testid="LoginForm_Login_Button"]')
	await page.waitForTimeout(5000)
	//while (page.$('div[data-testid="ocfSelectAvatarSkipForNowButton"]') == null)
	//	await page.waitForTimeout(1000)
	await page.click('div[data-testid="ocfSelectAvatarSkipForNowButton"]')
	// while (page.$('textarea[data-testid="ocfEnterTextTextInput"]') == null)
	// 	await page.waitForTimeout(1000)
	// await page.type('textarea[data-testid="ocfEnterTextTextInput"]', await random.gen_bio())
	// await page.waitForTimeout(1000)
	// await page.click('div[data-testid="ocfEnterTextNextButton"]')
	// await page.waitForTimeout(2000)
	return (0)
}

async function twitter_signin(page, mail, pass) {
	await page.goto('https://twitter.com/i/flow/login', {waitUntil: 'networkidle0'});
	await page.type('input[autocomplete="username"]', mail)
	await page.evaluate(`document.querySelectorAll('div[role="button"]')[2].click()`)
	await page.waitForSelector('input[name="password"]')
	await page.type('input[name="password"]', pass)
	await page.evaluate(`document.querySelectorAll('div[role="button"]')[2].click()`)
}

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
	await page.waitForTimeout(1000)
	await page.type('textarea[name="description"]', await random.gen_bio())
	await page.waitForTimeout(1000)
	await page.waitForSelector('div[data-testid="Profile_Save_Button"]')
	await page.click('div[data-testid="Profile_Save_Button"]'),
	await page.waitForTimeout(2000)
	var name = await page.evaluate(`
		var name = document.querySelector('a[aria-label="Profile"]').href.split('/')[3]
		'@' + name
	`)
	return (name)
}

async function create_twitter(mail, pass) {

	var proxy = give_proxy()
	console.log("PROXY == " + proxy)

	const browser = await puppeteer.launch({
		headless: false,
		args: [`--proxy-server=${proxy}`]
	});
	const page = await browser.newPage();
	await page.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36`)
	await page.setViewport({ width: 800, height: 600 })
	await page.goto('https://twitter.com/i/flow/signup', {waitUntil: 'networkidle0'});
	await page.evaluate(`document.querySelectorAll('div[role="button"]')[2].click()`)
	await page.waitForTimeout(2000)
	if (await init_twitter(page, mail, pass) == 1)
		console.log("Error while creating the mail")
	else {
		console.log("IMG")
		await page.goto("https://twitter.com/settings/profile", {waitUntil: 'networkidle0'})
		var tag = await assign_img(page)
		const cookies = await page.cookies();
			fs.writeFileSync(`../db/${mail}_cookies.json`, JSON.stringify(cookies, null, 2));
		acc.add(mail, pass, tag, proxy)
	}
	await browser.close()
}

create_twitter("bess_9991@outlook.com", "kphvvsVk7")

//console.log(give_proxy())

/*
	IMAP
*/
function new_imap(mail, pass) {
	var re = new ImapFlow({
		host: 'outlook.office365.com',
		port: 993,
		secure: true,
		auth: {
			user: mail,
			pass: pass
		},
		logger: false
	})
	return (re)
}

async function check_mail(imap) {
	var re = ""
	await sleep(5000)
	await imap.connect();
	let mailbox = await imap.mailboxOpen('INBOX');

	while (re == "") {
		for await (let msg of imap.fetch({from: "verify@twitter.com"}, {envelope: true})){
			if (msg.envelope.subject.includes("is your Twitter verification code")) {
				re = msg.envelope.subject.split(' ')[0];
			}
		}
	}
	console.log(re)
	await imap.close();
	return (re)
}

/*
	UTILS
*/
function	create_proxy_array() {
	let proxy = fs.readFileSync("C:/Users/paul9/Desktop/PROJECT/Twitter_giveaway/db/proxy.txt", 'utf8')
	let re = new Array
	var size = 0

	proxy = proxy.split('\r')

	for (let x in proxy) {
		size = x
	}

	for (let x in proxy) {
		proxy[x] = proxy[x].trim()
		if (proxy[x])
		re.push(new proxy_stat(proxy[x], size))
	}
	return (re);
}

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

/*
	TEST
*/