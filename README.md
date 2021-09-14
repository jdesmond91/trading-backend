# Trading Simulator - Backend - https://jonathandesmond.me/trading

This application lets you deposit cash and place simulated trades on a couple popular stocks. From there you can check on the portfolio and see how well your holdings are doing as well as view your transaction history.

## Technologies Used

Front-end created using React functional components, back-end API created using Node, Express and MongoDB. Frontend code can be found at https://github.com/jdesmond91/trading-frontend

## Local Setup

1. Make sure to have your own instance of MongoDB and Redis running already

2. Create an .env file in the root of the project with the following variables

```
MONGODB_URI='YOUR_MONGODB_URI'
TEST_MONGODB_URI='YOUR_MONGODB_TEST_URI'
PORT='YOUR_PORT_NUMBER'
REDIS_PORT='YOUR_REDIS_PORT_NUMBER'
```

3. Install and run the development instance

```
npm install
```

```
npm run dev
```

## Sample Requests and Responses

GET http://localhost:3001/api/trading/securities

```
[
  {
    "name": "Canadian Dollar",
    "ticker": "CAD",
    "type": "CASH",
    "id": "61105d502a3e9df368342e6e"
  },
  {
    "name": "Apple",
    "ticker": "AAPL",
    "type": "EQUITY",
    "id": "61117a7160b44d48af5268ed"
  }
]
```

POST http://localhost:3001/api/trading/securities

Request Body:
```
{
    "name": "Royal Bank",
	"ticker": "RY"
}
```

Response:
```
{
  "name": "Bank of Nova Scotia",
  "ticker": "BNS.TO",
  "id": "613ff611e3b172c002267cf1"
}
```

POST http://localhost:3001/api/trading/orders

Request Body:
```
{
    "type": "BUY",
    "securityId": "61117a7160b44d48af5268ed",
    "quantity": 2
}
```

Response:
```
{
  "type": "BUY",
  "submitDate": "2021-09-14T01:09:50.905Z",
  "security": "61117a7160b44d48af5268ed",
  "price": 149.55,
  "quantity": 2,
  "id": "613ff65ee3b172c002267cfa"
}
```

POST http://localhost:3001/api/trading/transactions/deposit

Request Body:
```
{
    "quantity": 1000
}
```

Response:
```
{
  "type": "DEPOSIT",
  "date": "2021-09-14T01:10:15.801Z",
  "quantity": 1000,
  "id": "613ff677e3b172c002267d04"
}
```

GET http://localhost:3001/api/trading/securities/price/AAPL

```
"149.55"
```

## Testing With Jest and Supertest

To get started with automated functional tests

```
npm run test
```

## Future Updates

1. JWT authentication and authorization
