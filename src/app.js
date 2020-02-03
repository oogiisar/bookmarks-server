require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const logger = require('./logger')
const bodyParser = express.json()
const uuid = require('uuid/v4')

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(cors())
app.use(helmet())


const bookmarks = [{
    description: "Oogii site",
    id: "1234455oo5i96599",
    rating: 5,
    title: "Oogii's Life",
    url: "http://oogiicodes.com"
}];

app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN
    const authToken = req.get('Authorization')
  
    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({ error: 'Unauthorized request' })
    }
    // move to the next middleware
    next()
})


app.get('/bookmarks', (req, res) => {
    res.json(bookmarks)
})

app.get('/bookmarks/:id', (req, res) =>{
    const { id } = req.params;
    const bookmark = bookmarks.find(b => b.id == id);
    if (!bookmark) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
          .status(404)
          .send('Bookmark Not Found');
    }
    
    res.json(bookmark);
})

app.post('/bookmarks', bodyParser, (req, res) => {
    const { description, rating, title, url } = req.body;
    if(!description) {
        logger.error('Description is required');
        return res
            .status(400)
            .send('Invalid data');
    } else if(!rating) {
        logger.error('Rating is required');
        return res
            .status(400)
            .send('Invalid data');
    } else if(!title) {
        logger.error('Title is required');
        return res
            .status(400)
            .send('Invalid data');
    } else if(!url) {
        logger.error('URL is required');
        return res
            .status(400)
            .send('Invalid data');
    }

    const id = uuid();
    const bookmark = {
        description,
        id,
        rating,
        title,
        url
    };

    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} created`);
    res
    .status(201)
    .location(`http://localhost:8000/bookmarks/${id}`)
    .json(bookmark);
});

app.delete('/bookmarks/:id', (req, res) => {
    const { id } = req.params;
    
    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

    if(bookmarkIndex === -1) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res 
            .status(404)
            .send('Not found');
    }
    bookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id ${id} deleted.`);
    res
        .status(204)
        .end();
});

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
       res.status(500).json(response)
})
    
module.exports = app

