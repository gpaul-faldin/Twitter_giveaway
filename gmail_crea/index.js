/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

/*
	INIT
*/
puppeteer.use(StealthPlugin())

async function test() {
	const browser = await puppeteer.launch({
		headless: true
	});
}
test()
test()
test()
test()
test()
test()
test()
test()
test()
test()
