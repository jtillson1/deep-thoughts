const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('./schemas');
const db = require('./config/connection');
const PORT = process.env.PORT || 3001;
const { authMiddleware } = require('./utils/auth');
const app = express();
//create new apollo server and pass in our schema data. we provide the type definitions and resolvers so they know what our API looks like and how it resolves requests
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware
});
// integrate our Apollo server with the Express application as middleware
server.applyMiddleware({ app });

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

db.once('open', () => {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    // log where we can go to test our GQL API
    console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
  });
});
