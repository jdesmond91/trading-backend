# Trading Simulator - Backend - https://jonathandesmond.me/trading

This application lets you deposit cash and place simulated trades on a couple popular stocks. From there you can check on the portfolio and see how well your holdings are doing as well as view your transaction history.

## Technologies Used

Front-end created using React functional components, back-end API created using Node, Express and MongoDB. Frontend code can be found at https://github.com/jdesmond91/trading-frontend

## Local Setup

1. Make sure to have your own instance of MongoDB and Redis running already

2. Create an .env file in the root of the project with the following variables

~~~
MONGODB_URI='YOUR_MONGODB_URI'
TEST_MONGODB_URI='YOUR_MONGODB_TEST_URI'
PORT='YOUR_PORT_NUMBER'
REDIS_PORT='YOUR_REDIS_PORT_NUMBER'
~~~

3. Install and run the development instance

~~~
npm install
~~~
~~~
npm run dev
~~~

## Testing With Jest and Supertest

To get started with automated functional tests
~~~
npm run test
~~~

## Future Updates
1. JWT authentication and authorization
