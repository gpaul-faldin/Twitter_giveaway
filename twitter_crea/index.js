/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const pic = require('../banner-pp/index.js').picture
const chance = require('chance').Chance()
const axios = require('axios').default
const { ImapFlow } = require('imapflow');
const fs = require('fs')

/*
	INIT
*/

	///////CLASS///////

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
	constructor(country, service) {
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
	}
	async get_number(opt) {
		try {
			const resp = await axios.get(this.url + `api_key=${this.api_key}&action=${this.action[0]}&service=${this.service}&country=${this.country}`)
			let tmp = resp.data.split(':')
			if (tmp[0] === "ACCESS_NUMBER") {
				this.id = tmp[1]
				if (opt == 1)
					this.nbr = tmp[2].substring(1)
				else
					this.nbr = tmp[2]
			}
			else
				console.log(resp.data)
		}
		catch(e){
			console.log(e)
		}
	}
	async set_status() {
		try {
			const resp = await axios.get(this.url + `api_key=${this.api_key}&action=${this.action[1]}&status=1&id=${this.id}`)
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
}

class add_new {
	constructor() {
		this.path = "../db/accounts.txt"
	}
	add(mail,pass,tag) {
		let re = `${mail}:${pass}:${tag}\n`
		let content = fs.readFileSync(this.path, {encoding: 'utf8'})
		if (content.includes(mail) == false)
			fs.appendFileSync(this.path, re)
	}
}

	//////MISC//////

const picture = new pic
const random = new rand
const acc = new add_new
/*
	PUPPETEER
*/

async function login_gmail(page, mail, pass) {

	await page.waitForSelector("#identifierId")
	await page.type("#identifierId", mail)
	var url = await page.mainFrame().url()
	await page.click("#identifierNext > div > button")
	await page.waitForTimeout(2000)
	if (await page.mainFrame().url() == url)
		return (1)
	await page.type('#password', pass)
	url = await page.mainFrame().url()
	await page.click("#passwordNext")
	await page.waitForTimeout(2000)
	if (await page.mainFrame().url() == url)
			return (1)
	url = await page.mainFrame().url()
	if (url.includes('https://accounts.google.com/signin/v2/challenge/iap?')) {
		let phone = new phone_number(6, 'go')
		await phone.get_number(0)
		console.log(phone.nbr)
		console.log(phone.id)
		await page.type("#phoneNumberId", '+' + phone.nbr)
		await page.click("#idvanyphonecollectNext > div > button")
		await phone.set_status()
		while (await phone.get_status() === "STATUS_WAIT_CODE")
			await page.waitForTimeout(5000)
		let code = await phone.get_status()
		code = code.split(':')[1]
		await page.type('input[type="tel"]', code)
		await page.click('#idvanyphoneverifyNext > div > button')
		await phone.set_status()
	}
	try {
		await page.waitForSelector(`div[id="confirm_yes"]`)
		await page.click('div[id="confirm_yes"]')
	}
	catch(e) {}
}

async function init_twitter(page, email, pass) {
	await page.waitForSelector('select[id="SELECTOR_1"]')
	await page.type('input[name="name"]', random.gen_name())
	await page.evaluate(`document.querySelectorAll('div[role="button"]')[3].click()`)
	await page.waitForSelector('input[name="email"]')
	await page.type('input[name="email"]', email)
	await page.select('select[id="SELECTOR_1"]', String(random.gen_month()))
	await page.select('select[id="SELECTOR_2"]', String(random.gen_day()))
	await page.select('select[id="SELECTOR_3"]', String(random.gen_year()))
	await page.waitForTimeout(2000)
	await page.evaluate(`document.querySelectorAll('div[role="button"]')[4].click()`)
	await page.waitForTimeout(2000)
	await page.evaluate(`document.querySelectorAll('div[role="button"]')[3].click()`)
	await page.waitForTimeout(2000)
	await page.evaluate(`document.querySelectorAll('div[role="button"]')[4].click()`)
	await page.waitForTimeout(2000)
	//try {
		await page.type('input[name="verfication_code"]', await check_mail(new_imap(email, pass)))
		await page.waitForTimeout(1000)
		await page.evaluate(`document.querySelectorAll('div[role="button"]')[3].click()`)
		await page.waitForTimeout(1000)
		if (await page.$('input[name="phone_number"]') != null) {
			let phone = new phone_number(2, 'tw')
			await phone.get_number(1)
			await page.type('input[name="phone_number"]', phone.nbr)
			await page.select(`#SELECTOR_4`, "KZ")
			await page.waitForTimeout(1000)
			await page.evaluate(`document.querySelectorAll('div[role="button"]')[0].click()`)

		}
		await page.waitForSelector('input[type="password"]')
		await page.type('input[type="password"]', pass)
		await page.click('div[data-testid="LoginForm_Login_Button"]')
		await page.click('div[data-testid="ocfSelectAvatarSkipForNowButton"]')
		await page.type('textarea[data-testid="ocfEnterTextTextInput"]', await random.gen_bio())
		await page.click('div[data-testid="ocfEnterTextNextButton"]')
		await page.waitForTimeout(500)
		await page.evaluate(`document.querySelectorAll('span[role="button"]')[1]`)
		await page.waitForTimeout(500)
		await page.evaluate(`document.querySelectorAll('div[role="button"]')[2].click()`)
		await page.waitForTimeout(500)
		await page.evaluate(`document.querySelectorAll('div[role="button"]')[2].click()`)
		await page.waitForTimeout(500)
		await page.evaluate(`document.querySelectorAll('div[role="button"]')[3].click()`)
		await page.waitForTimeout(500)
		await page.evaluate(`document.querySelectorAll('div[role="button"]')[3].click()`)
		await page.waitForTimeout(500)
		await page.evaluate(`document.querySelectorAll('div[style="color: rgb(15, 20, 25);"]')[2].click()`)
		await page.waitForTimeout(500)
		await page.evaluate(`document.querySelectorAll('div[style="color: rgb(15, 20, 25);"]')[2].click()`)
		await page.evaluate(`document.querySelectorAll('div[style="color: rgb(15, 20, 25);"]')[13].click()`)
	// }
	// catch(e) {
	// 	await twitter_signin(page, email, pass)
	// }
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
	await page.goto("https://twitter.com/settings/profile", {waitUntil: 'networkidle2'})
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

	const browser = await puppeteer.launch({
		headless: false
	});
	const page = await browser.newPage();
	await page.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36`)
	await page.setViewport({ width: 800, height: 600 })
	await page.goto('https://twitter.com/i/flow/signup', {waitUntil: 'networkidle0'});
	await page.click('div[style="border-color: rgba(0, 0, 0, 0);"]')
	await page.waitForTimeout(2000)
	await init_twitter(page, mail, pass)
	console.log("here")
	await page.waitForNavigation({ waitUntil: 'networkidle2' })
	console.log("here")
	var tag = await assign_img(page)
	acc.add(mail, pass, tag)
	await browser.close()
}

create_twitter("robkubica456@hotmail.com", "cacaswag123")


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
	await sleep(10000)
	await imap.connect();
	let mailbox = await imap.mailboxOpen('INBOX');

	while (re == "") {
		for await (let msg of imap.fetch({from: "verify@twitter.com"}, {envelope: true})){
			if (msg.envelope.subject.includes("is your Twitter verification code")) {
				re = msg.envelope.subject.split(' ')[0];
				break ;
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
function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/*
	TEST
*/
//check_mail(new_imap("echocatouaf@outlook.com", "cacaswag123"))