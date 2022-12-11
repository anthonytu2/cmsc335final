const http = require("http");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const express = require("express");
const app = express();
const { response } = require("express");

process.stdin.setEncoding("utf8");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));

// DeepL Translator API 
const options = {
	"method": "POST",
	"hostname": "deepl-translator.p.rapidapi.com",
	"port": null,
	"path": "/translate",
	"headers": {
		"content-type": "application/json",
		"X-RapidAPI-Key": "SIGN-UP-FOR-KEY",
		"X-RapidAPI-Host": "deepl-translator.p.rapidapi.com",
		"useQueryString": true
	}
};

const req = http.request(options, function (res) {
	const chunks = [];

	res.on("data", function (chunk) {
		chunks.push(chunk);
	});

	res.on("end", function () {
		const body = Buffer.concat(chunks);
		console.log(body.toString());
	});
});

req.write(JSON.stringify({text: 'This is a example text for translation.', source: 'EN', target: 'ES'}));
req.end();