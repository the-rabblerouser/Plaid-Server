const express = require('express');
const cors = require('cors');
const { Client, environments } = require('plaid');
require('dotenv').config();

const app = express();
app.use(express.json()); //Notice express.json middleware

const port = 4000;

const { PLAID_CLIENT_ID, PLAID_SECRET } = process.env;

const client = new Client({
	clientID: PLAID_CLIENT_ID,
	secret: PLAID_SECRET,
	env: environments.sandbox,
});

app.use(cors());

let accessToken;
let itemId;

app.get('/api/create_link_token', async (req, res) => {
	const configs = {
		user: {
			client_user_id: '123-test-user-id',
		},
		client_name: 'Plaid Test App',
		products: ['auth', 'transactions'],
		country_codes: ['US'],
		language: 'en',
		account_filters: {
			depository: {
				account_subtypes: ['checking', 'savings'],
			},
		},
	};

	try {
		const response = await client.createLinkToken(configs);
		return res.send({ link_token: response.link_token });
	} catch (err) {
		return res.send({ err: err.message });
	}
});

app.post('/api/set_access_token', async (req, res) => {
	try {
		const { public_token } = req.body;

		const { access_token, item_id } = await client.exchangePublicToken(
			public_token
		);

		accessToken = access_token;
		itemId = item_id;
		res.send(itemId);
	} catch (e) {
		if (!public_token) {
			return 'no public token';
		}
	}
});

app.get('/api/transactions', async (req, res) => {
	try {
		const response = await client.getTransactions(
			accessToken,
			'2021-04-01',
			'2021-05-31',
			{
				count: 50,
				offset: 0,
			}
		);
		const transactions = response.transactions;

		res.send(transactions);
	} catch (err) {
		if (!accessToken) {
			return 'no access token';
		}
	}
});

app.get('/api/balance', async (req, res) => {
	try {
		const response = await client.getBalance(accessToken);
		const { accounts } = response;

		res.send(accounts);
	} catch (err) {
		if (!accessToken) {
			return 'no access token';
		}
	}
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});
