const { getAll, create, getOne, remove, update,verifyEmail, login } = require('../controllers/user.controllers');
const express = require('express');

const userRouter = express.Router();

userRouter.route('/')
    .get(getAll)
    .post(create);


userRouter.route('/verify/:code') 
    .get(verifyEmail);

userRouter.route('/login')
    .post(login)
    


userRouter.route('/:id')
    .get(getOne)
    .delete(remove)
    .put(update);

module.exports = userRouter;