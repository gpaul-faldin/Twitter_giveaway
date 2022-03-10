/*
	REQUIRE
*/
const express = require('express')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

/*
	INIT
*/
const app = express()
puppeteer.use(StealthPlugin())

app.get("/", (req, res) => {
	res.send("YOOOOO\n")
})

app.listen(3000)