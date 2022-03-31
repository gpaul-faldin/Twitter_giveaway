/*
	REQUIRE
*/

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const {phone_number} = require('./sms_wrapper.js')
const fs = require('fs');
const {parentPort} = require("worker_threads");

/*
	THREADS
*/

parentPort.on("message", async (data) => {
	await check_pva(data.action, data.account, data.array, data.index)
	parentPort.postMessage("OK")
})

/*
	PUPPETEER
*/

puppeteer.use(StealthPlugin())


