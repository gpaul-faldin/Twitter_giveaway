const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require("fs")
const axios = require("axios")
puppeteer.use(StealthPlugin())
var Chance = require('chance').Chance()


async function test() {
	var acc = "CherylW40397442"
	var proxy = "45.146.131.137:3128"

	const browser = await puppeteer.launch({
		headless: false,
		args: [`--proxy-server=${proxy}`]
	});
	const page = await browser.newPage();
	await page.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36`)
	await page.setViewport({ width: 800, height: 600 })
	const cookiesString = fs.readFileSync(__dirname + `/cookies/${acc}_cookies.json`);
	const cookies = JSON.parse(cookiesString);
	await page.setCookie(...cookies);
	await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' })
	//await page.evaluate(`
	//	document.querySelector('div[style="backdrop-filter: blur(4px); background-color: rgba(0, 0, 0, 0.75);"]').click()
	//`)
	//if (await page.url() == "https://twitter.com/account/access")
	//	if (await pva(page) == 1)
	//		await browser.close()
	//	else
	//		console.log("OK")
	//await browser.close()
	await page.waitForTimeout(100000)
}
test()

async function download_image(url, image_path){
	axios({
		url,
		responseType: 'stream',
	}).then(
		response =>
			new Promise((resolve, reject) => {
				response.data
					.pipe(fs.createWriteStream(image_path))
					.on('finish', () => resolve())
					.on('error', e => reject(e));
			}),
	);
	}

async function tmp() {
	for (let i = 0; i < 15; i++) {
		await download_image("https://tinyfac.es/api/avatar.jpg?quality=0&gender=male", __dirname + `/banner-pp/db/pp/${String(Chance.integer())}.png`)
	}
}
//tmp()