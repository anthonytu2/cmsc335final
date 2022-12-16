const fetch = require('node-fetch');
const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') })
const bodyParser = require("body-parser");
const fs = require("fs");
const express = require("express");
const app = express();
const { response } = require("express");
const e = require('express');

// MongoDB imports 
const userName = process.env.MONGO_DB_USERNAME;
const passWord = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');

process.stdin.setEncoding("utf8");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
const portNumber = process.argv[2] || 5000;
console.log(`Visit http://localhost:${portNumber}`);

// Connecting to the Mongo Databse
const uri = `mongodb+srv://${userName}:${passWord}@cluster0.ae9zey0.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function hi(){try {
	await client.connect();
} catch(e) {
	console.log(e);
}}
hi();

// Microsoft Translator Text API
// Starter code
const url = 'https://microsoft-translator-text.p.rapidapi.com/translate?to%5B0%5D=%3CREQUIRED%3E&api-version=3.0&profanityAction=NoAction&textType=plain';

const options = {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'X-RapidAPI-Key': '42e2f88aa4msh9b9e63c519efcd4p1e7f5bjsn71acb1cbaca4',
    'X-RapidAPI-Host': 'microsoft-translator-text.p.rapidapi.com'
  },
  body: '[{"Text":"I would really like to drive your car around the block a few times."}]'
};

// routing section start
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response)=>{
	response.render("welcome", {portNumber:portNumber});
});

app.get("/translate", (request, response)=>{
	let {username, password, original} = request.body;
	let currentUser = request.query.username;
	console.log("username insert:" + currentUser);

	original = request.query.lang1Text || "";
	let translation = "";
	let lang = request.query.lang2;

	const options = {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'X-RapidAPI-Key': '42e2f88aa4msh9b9e63c519efcd4p1e7f5bjsn71acb1cbaca4',
			'X-RapidAPI-Host': 'microsoft-translator-text.p.rapidapi.com'
		},
		body: `[{"Text":"${original}"}]`
	};
	
	fetch(`https://microsoft-translator-text.p.rapidapi.com/translate?to%5B0%5D=${lang}&api-version=3.0&profanityAction=NoAction&textType=plain`, options)
	.then(response => response.json())
	.then(async res => {
		let resJSON = res[0]
		translation = resJSON.translations[0].text
		// adding the translation to the history of the user
		const options2 = {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'X-RapidAPI-Key': '42e2f88aa4msh9b9e63c519efcd4p1e7f5bjsn71acb1cbaca4',
				'X-RapidAPI-Host': 'microsoft-translator-text.p.rapidapi.com'
			},
			body: `[{"Text":"${original}"}]`
		};

		let lang1 = ""

		// Detects the language of the original text
		const url = 'https://microsoft-translator-text.p.rapidapi.com/Detect?api-version=3.0';
		await fetch(url, options)
			.then(res => res.json())
			.then(json => {lang1 = json[0].language})
			.catch(err => console.error('error:' + err));

		console.log(translation + " " + lang1)

		await insertTrans(client, databaseAndCollection, currentUser, {lang1: lang1, original: original, lang2: lang, translation: translation});

		console.log(translation)
		response.render("translator", {portNumber:portNumber, username:currentUser, original:original, translation:translation});
	})
	.catch(err =>{ console.error(err)
		response.render("translator", {portNumber:portNumber, username:currentUser, original:original, translation:translation});
	});


});

app.post("/translate", async (request, response)=>{
	let {username, password, original} = request.body;
	let currentUser = username || currentUser;
	let translation = "";
	// TODO: Make sure to clear the guest history
	if(currentUser === "guest"){
		await clearGuestHistory(client, databaseAndCollection);
	}
	const result = await lookupUser(client, databaseAndCollection, currentUser);
	if (result){
		const pass = await matchPassword(client, databaseAndCollection, currentUser, password);
		if (pass) {
			console.log("translate post")
			response.render("translator", {portNumber:portNumber, username:currentUser, original:original, translation:translation});
		} else {
			response.render("loginFail");
		}
		
	} else {
		response.render("signup", {portNumber:portNumber});
	}
});

app.get("/signup", (request, response) => {
	response.render("signup", {portNumber:portNumber});
});

app.post("/signup", async (request, response) => {
	let {username, password} = request.body;
	console.log("signing up")
	/*
	TODO: search database if username already exists, 
	*/
	// Search database to check if username already exists
	const result = await lookupUser(client, databaseAndCollection, username);
	if(result.username){
		response.render("signupFail", {username:username})
	} else {
		// add the user to the database
		const user = {
			username:username,
			password:password,
			history:[]
		}
		await insertUser(client, databaseAndCollection, user);
		response.render("signupConfirm", {username:username});
	}
});

// Creates a table from a users previous translations and send them in for the get
async function makeTable(username){
	console.log("username:" + username);
	table = ""
	// create the table here
	try {
		await client.connect();
		const result = await lookupUser(client, databaseAndCollection, username);
		console.log(result);
		result.history.forEach(elem => {
			table += '<tr>';
			table += `<td>${elem.lang1}</td>`;
			table += `<td>${elem.original}</td>`;
			table += `<td>${elem.lang2}</td>`;
			table += `<td>${elem.translation}</td>`;
			table += '</tr>';
		})
		return table;

	}catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
	// There will always be a user (Guest or an actual one)
}

app.get("/log", async (request, response)=>{
	const username = request.query.username;
	table = await makeTable(username);
	response.render("log", {portNumber:portNumber, table:table});

});


app.listen(portNumber);

//routing section end

// MongoDB section start

// Checks to see if the username exits in the database
async function lookupUser(client, databaseAndCollection, username){
	const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne({username: username});
	return result;
}

// Inserts the username and password into the database
async function insertUser(client, databaseAndCollection, user){
	await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(user);
}

// Add new translations into the history of the user
async function insertTrans(client, databaseAndCollection, username, historyTuple){
	await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).updateOne({username: username}, {$push: {history: historyTuple}});
}

// Clear the guest history 
async function clearGuestHistory(client, databaseAndCollection){
	await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).updateOne({username:'guest'}, {$set:{history: []}})
}

// Check if the password matches
async function matchPassword(client, databaseAndCollection, username, password){
	const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne({username: username, password: password});
	return result;
}
