const express = require('express');
const Favorite = require('../models/favorites')
const Campsite = require('../models/campsite')
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({user: req.user._id})
        .populate("user")
        .populate("[campsites]")
        .then(favorites => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
        })
        .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({user: req.user._id})
        .then(favorite => {
            if (favorite) {
                req.body.forEach (bodyId => {
                    if (!favorite.campsites.includes(bodyId._id)){
                        favorite.campsites.push(bodyId._id);
                    }
                })
                favorite.save()
                .then(newfavorite => { 
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(newfavorite);
                })
                .catch(err => next(err));
            } else {
                Favorite.create({user: req.user._id, campsites: req.body})
                .then(favorite => {
                    console.log('Favorite is added ', favorite);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
                .catch(err => next(err));
            }
        })
        .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({user: req.user._id})
        .then(response => {
            if (response) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
                
                console.log ('Favorite is deleted');
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('You do not have any favorites to delete.');
            }
        })
        .catch(err => next(err)); 
    });

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({user: req.user._id})
        .then(favorite => {
            Campsite.findById(req.params.campsiteId)
            .then(campsite => {
                if (campsite) {
                    if(favorite) {
                        if (!favorite.campsites.includes(req.params.campsiteId)) {
                            favorite.campsites.push(req.params.campsiteId)
                            favorite.save()
                            .then(favorite => {
                                console.log('Favorite is added ', favorite);
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite.campsites);
                            })
                            .catch(err => next(err));
                        } else {
                            res.statusCode = 401;
                            res.setHeader('Content-Type', 'text/plain');
                            res.end("That campsite is already in the list of favorites!")
                        }
                    }   else {
                        Favorite.create({user: req.user._id, campsites: [req.params.campsiteId]})
                        .then(favorite => {
                            console.log('Favorite is added ', favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite.campsites);
                        })
                        .catch(err => next(err));
                    }
                } else {
                    res.statusCode = 403;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end("That campsite is not exist!")
                }
            })
            .catch(err => next(err));
        });
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({user: req.user._id})
        .then(favorite => {
            if (favorite) {
                favorite.campsites = favorite.campsites.filter( campsite => !campsite.equals(req.params.campsiteId))
                favorite.save()
                .then(saveFavorite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(saveFavorite);
                })
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('You do not have any favorites to delete.');
            }
        })
        .catch(err => next(err));
    });

module.exports = favoriteRouter;