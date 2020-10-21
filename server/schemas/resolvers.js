const { User, Thought } = require('../models');
const resolvers = {
    // We have a single function that will return every single piece 
   // of data associated with a user, but none of it will be returned 
    // unless we explicitly list those fields when we perform our queries.
    Query: {
        thoughts: async (parent, { username }) => {
            const params = username ? { username } : {};
            return Thought.find(params).sort({ createdAt: -1 });
          },
          //get single thought
          thought: async (parent, { _id }) => {
            return Thought.findOne({ _id });
          },
          //get all usrs
          users: async () => {
              return User.find()
              .select('-__v -password')
              .populate('friends')
              .populate('thoughts');
          },
          //get user by username
          user: async (parent, { username }) => {
            return User.findOne({ username })
              .select('-__v -password')
              .populate('friends')
              .populate('thoughts');
          },
          

    }
};

module.exports = resolvers;