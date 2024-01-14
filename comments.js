// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { randomBytes } = require('crypto');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create an empty object for comments
const commentsByPostId = {};

app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', async(req, res) => {
    // Generate a random id for the comment
    const commentId = randomBytes(4).toString('hex');
    // Get the comment from the request body
    const { content } = req.body;
    // Get the post id from the url
    const postId = req.params.id;
    // Get the comments for the post
    const comments = commentsByPostId[postId] || [];
    // Push the new comment to the array
    comments.push({ id: commentId, content, status: 'pending' });
    // Update the object with the new comments
    commentsByPostId[postId] = comments;
    // Send the new comment
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId,
            status: 'pending'
        }
    });

    res.status(201).send(comments);
});

app.post('/events', async(req, res) => {
    console.log('Event Received:', req.body.type);
    const { type, data } = req.body;
    if (type === 'CommentModerated') {
        const { postId, id, status, content } = data;
        const comments = commentsByPostId[postId];
        const comment = comments.find(comment => {
            return comment.id === id;
        });
        comment.status = status;
        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                postId,
                status,
                content
            }
        });
    }
    res.send({});
});

// Listen on port 4001
app.listen(4001, () => {
    console.log('Listening on 4001');
});