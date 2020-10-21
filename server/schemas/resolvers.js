const { User, Thought } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');
const resolvers = {
    // We have a single function that will return every single piece 
    // of data associated with a user, but none of it will be returned 
    // unless we explicitly list those fields when we perform our queries.
    //* parent is a placeholder* ????
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


    },
    Mutation: {
        addUser: async (parent, args) => {
            //Here, the Mongoose User model creates a new user in the database with whatever is passed in as the args.
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };

        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const token = signToken(user);
            return { token, user };
        }
    }
};

module.exports = resolvers;