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
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('thoughts')
                    .populate('friends');

                return userData;
            }
            throw new AuthenticationError('Not logged in');
        }

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
        },
        //only logged-in users should be able to use this mutation to add a thought...
        addThought: async (parent, args, context) => {
            if (context.user) {
                const thought = await Thought.create({ ...args, username: context.user.username });

                await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $push: { thoughts: thought._id } },
                    //new: true makes Mongo return the updated doc instead of original
                    { new: true }
                );
                return thought;
            }
            throw new AuthenticationError('you have to login, bitch!');
        },
        addReaction: async (parent, { thoughtId, reactionBody }, context) => {
            if (context.user) {
                const updatedThought = await Thought.findOneAndUpdate(
                    { _id: thoughtId },
                    //Reactions are stored as arrays on the Thought model, so you'll use the Mongo $push operator
                    { $push: { reactions: { reactionBody, username: context.user.username } } },
                    { new: true, runValidators: true }
                );

                return updatedThought;
            }
            throw new AuthenticationError('you have to login, bitch!');
        },
        //This mutation will look for an incoming friendId and add that 
        // to the current user's friends array. A user can't be friends with 
        // the same person twice, though, hence why we're using the $addToSet 
        // operator instead of $push to prevent duplicate entries.
        addFriend: async (parent, { friendId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { friends: friendId } },
                    { new: true }
                ).populate('friends');

                return updatedUser;
            }
            throw new AuthenticationError('you have to login, bitch!');

        }
    }
};

module.exports = resolvers;