const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Favorites = require('../models/favorite');
const favorite = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
        .populate('user')
        .populate('dishes')
        .exec((err,favorites) => {
            if(err) return next(err);
            res.statusCode = 200;
            res.setHeader ('Content-Type' , 'application/json');
            res.json(favorites);            
        });
})
.post(cors.corsWithOptions, authenticate.verifyUser,(req, res, next) => {
        Favorites.find({ user:req.user._id} , (err, favorite))
            if (err) return next(err);
            if(!favorite){
                Favorites.create ({user:req.user._id})
                .then((favorite)=>{
                    for (i=0;i<req.body.length;i++)
                        if(favorite.dishes.indexOf(req.body[i]._id))
                            favorite.dishes.push(req.body[i]);
                    favorite.save()
                    .then ((favorite)=>{
                        Favorites.findById(favorite._id)
                        .populate('user')
                        .populate('dishes')
                        .then((favorite) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        })
                    })    
                    .catch((err)=>{
                        return next(err);
                    });        
                })
                
            }
            else{
                for (i=0;i<req.body.length;i++)
                        if(favorite.dishes.indexOf(req.body[i]._id) < 0)
                            favorite.dishes.push(req.body[i]);
                    favorite.save()
                    .then ((favorite)=>{
                        Favorites.findById(favorite._id)
                        .populate('user')
                        .populate('dishes')
                        .then((favorite) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        })
                    })    
                    .catch((err)=>{
                        return next(err);
                    });        
            }
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader ('Content-Type', 'text/plain');
    res.end('PUT operation is not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({})
        .populate('user')
        .populate('dishes')
        .then((favorites) => {
            var favToRemove;
            if (favorites) {
                favToRemove = favorites.filter(fav => fav.user._id.toString() === req.user.id.toString())[0];
            } 
            if(favToRemove){
                favToRemove.remove()
                    .then((result) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(result);
                    }, (err) => next(err));
                
            } else {
                var err = new Error('You do not have any favorites');
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user:req.user._id})
        .then((favorites) => {
            if(!favorites){
                res.statusCode = 200;
                res.setHeader( 'Content-Type' , 'application/json' );
                return res.json({"exists":false , "favorites" : favorites });
            }
            else{
                if ( favorites.dishes.indexOf(req.params.dishId) < 0 ){
                    res.statusCode = 200;
                    res.setHeader( 'Content-Type' , 'application/json' );
                    return res.json({"exists":false , "favorites" : favorites });
                }
                else{
                    res.statusCode = 200;
                    res.setHeader( 'Content-Type' , 'application/json' );
                    return res.json({"exists":true , "favorites" : favorites }); 
                }
            }
        }, (err) => next(err))
        .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.find({ user:req.user._id}, (err,favorite))
           if(err) return next(err);
           
           if (!favorite){
               Favorites.create({user:req.user._id})
               .then ((favorite)=>{
                   favorite.dishes.push({"_id":req.params.dishId})
                   favorite.save()
                   .then ((favorite)=>{
                       Favorites.findById(favorite._id)
                       .populate('user')
                        .populate('dishes')
                        .then((favorite) => {
                             res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        })
                   })
                    .catch((err) => {return (err)});
               })
                .catch((err) => {return (err)});
           }
           else{
               if(favorite.dishes.indexOf(req.params.dishId) < 0){
                   favorite.dishes.push({"_id":req.params.dishId})
                   favorite.save()
                   .then ((favorite)=>{
                       Favorites.findById(favorite._id)
                       .populate('user')
                        .populate('dishes')
                        .then((favorite) => {
                             res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        })
                   })
                    .catch((err) => {return (err)});
               }
           }
            
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader ("Content-Type" ,"text/plain");
    res.end('PUT operation is not supported on /favorites/:dishId');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user:req.user._id} , (err,favorite))
        if(err)return next(err);
        
        var index  =  favorite.dishes.indexOf(req.params.dishId);
        if( index>=0){
            favorite.dishes.splice(index,1);
            favorite.save()
            .then ((favorite)=>{
                Favorites.findById(favorite._id)
                .populate('user')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                })
            })
                .catch((err) => {
                    return next(err);
                })
        }
        else{
            res.statusCode = 404;
            res.setHeader = ( "Content-Type" , "text/plain" );
            res.end('Dish  ' + req.params._id+ ' is not in your favorites');
        }
        
       
       
});

module.exports = favoriteRouter;