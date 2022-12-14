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
const portNumber = process.argv[2] || 5000;
console.log(`Visit http://localhost:${portNumber}`);

// Microsoft Translator Text API
// Starter code
const fetch = require('node-fetch');

const url = 'https://microsoft-translator-text.p.rapidapi.com/translate?to%5B0%5D=%3CREQUIRED%3E&api-version=3.0&profanityAction=NoAction&textType=plain';

const options = {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'X-RapidAPI-Key': '252feb1770msh525fa056a0b9266p16d177jsnefa8d131f1e8',
    'X-RapidAPI-Host': 'microsoft-translator-text.p.rapidapi.com'
  },
  body: '[{"Text":"I would really like to drive your car around the block a few times."}]'
};

fetch(url, options)
	.then(res => res.json())
	.then(json => console.log(json))
	.catch(err => console.error('error:' + err));

// routing section start
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response)=>{

	response.render("welcome", {portNumber:portNumber});

});

app.get("/translate", (request, response)=>{
	let {username, password, original} = request.body;
	currentUser = username || currentUser;
	original = "";
	translation = "";
	console.log("tranlate get")
	response.render("translator", {portNumber:portNumber, username:currentUser, original:original, translation:translation});

});

app.post("/translate", (request, response)=>{
	let {username, password, original} = request.body;
	currentUser = username || currentUser;
	original = original || "";
	
	translation = "";
	/*
	TODO: use api to convert original text into translation
	*/

	console.log("translate post")
	response.render("translator", {portNumber:portNumber, username:currentUser, original:original, translation:translation});

});

app.get("/signup", (request, response)=>{

	response.render("signup", {portNumber:portNumber});

});

app.post("/signup", (request, response)=>{
	let {username, password} = request.body;
	console.log("signing up")
	/*
	TODO: search database if username already exists, 
	*/
	if (Math.random() < .5){
		response.render("signupFail", {username:username})
	}
	else {
		currentUser = username
		response.render("signupConfirm", {username:username});

	}


});

/*
*TODO: functionality to create a table from a users previous translations and send them in for the get
*/
function makeTable(){
	table = ""

	return table;
}

app.get("/log", (request, response)=>{

	response.render("log", {portNumber:portNumber, table:"table stuff"});

});



app.listen(portNumber);


//routing section end