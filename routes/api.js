/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const request = require('request');
require('dotenv').config();
const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function(app) {

    app.route('/api/stock-prices')
        .get(function(req, res) {
            if (!req.query.stock) {
                res.json({ error: 'no stock provide' });
            } else if (!Array.isArray(req.query.stock)) {
                MongoClient.connect(CONNECTION_STRING, (err, db) => {
                    if (err) {
                        res.json({ error: 'Database error: ' + err });
                    }
                    if (!req.query.like) {
                        db.collection('stocklikes').find({ stock: req.query.stock }).toArray((err, likes) => {
                            if (err) {
                                res.json({ error: 'Error find: ' + err });
                            }
                            const url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=' + req.query.stock + '&apikey=' + process.env.APIKEY;
                            request(url, function(error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    if (!JSON.parse(body)['Error Message']) {
                                        const getStock = JSON.parse(body)['Global Quote'];
                                        res.json({ "stockData": { "stock": getStock['01. symbol'], "price": getStock['05. price'], "likes": likes.length } })
                                    } else {
                                        res.json({ error: 'Stock dont exist' });
                                    }
                                }
                            });
                        })
                    } else {
                        const stocklike = {
                            stock: req.query.stock,
                            ip: req.connection.remoteAddress
                        }
                        db.collection('stocklikes').findOne(stocklike, (err, like) => {
                            if (err) {
                                res.json({ error: 'Error find: ' + err });
                            }
                            if (!like) {
                                db.collection('stocklikes').insertOne(stocklike, (err, data) => {
                                    if (err) {
                                        res.json({ error: 'Erro to save this book' });
                                    }
                                    db.collection('stocklikes').find({ stock: req.query.stock }).toArray((err, likes) => {
                                        if (err) {
                                            res.json({ error: 'Error find: ' + err });
                                        }
                                        const url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=' + req.query.stock + '&apikey=' + process.env.APIKEY;
                                        request(url, function(error, response, body) {
                                            if (!error && response.statusCode == 200) {
                                                if (!JSON.parse(body)['Error Message']) {
                                                    const getStock = JSON.parse(body)['Global Quote'];
                                                    res.json({ "stockData": { "stock": getStock['01. symbol'], "price": getStock['05. price'], "likes": likes.length } })
                                                } else {
                                                    res.json({ error: 'Stock dont exist' });
                                                }
                                            }
                                        });
                                    })
                                })
                            } else {
                                db.collection('stocklikes').find({ stock: req.query.stock }).toArray((err, likes) => {
                                    if (err) {
                                        res.json({ error: 'Error find: ' + err });
                                    }
                                    const url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=' + req.query.stock + '&apikey=' + process.env.APIKEY;
                                    request(url, function(error, response, body) {
                                        if (!error && response.statusCode == 200) {
                                            if (!JSON.parse(body)['Error Message']) {
                                                const getStock = JSON.parse(body)['Global Quote'];
                                                //console.log(JSON.parse(body)['Global Quote'])
                                                res.json({ "stockData": { "stock": getStock['01. symbol'], "price": getStock['05. price'], "likes": likes.length } })
                                            } else {
                                                res.json({ error: 'Stock dont exist' });
                                            }
                                        }
                                    });
                                })
                            }
                        })

                    }
                })
            } else {
                if (!req.query.like) {
                    const url = 'http://localhost:3000/api/stock-prices?stock='
                    request(url + req.query.stock[0], function(error, firstresponse, firstbody) {
                        if (!error && firstresponse.statusCode == 200) {
                            if (!JSON.parse(firstbody)[error]) {
                                const firstgetStock = JSON.parse(firstbody)['stockData'];
                                request(url + req.query.stock[1], function(error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        if (!JSON.parse(body)[error]) {
                                            const secondgetStock = JSON.parse(body)['stockData'];
                                            const relative = firstgetStock.likes - secondgetStock.likes;
                                            res.json({
                                                "stockData": [{ "stock": firstgetStock.stock, "price": firstgetStock.price, "rel_likes": firstgetStock.likes - relative },
                                                    { "stock": secondgetStock.stock, "price": secondgetStock.price, "rel_likes": secondgetStock.likes - relative }
                                                ]
                                            })
                                        } else {
                                            res.json(JSON.parse(body)[error])
                                        }
                                    }
                                })
                            } else {
                                res.json(JSON.parse(body)[error])
                            }
                        }
                    })
                } else {
                    const url = 'http://localhost:3000/api/stock-prices?stock='
                    request(url + req.query.stock[0] + '&like=true', function(error, firstresponse, firstbody) {
                        if (!error && firstresponse.statusCode == 200) {
                            if (!JSON.parse(firstbody)[error]) {
                                const firstgetStock = JSON.parse(firstbody)['stockData'];
                                request(url + req.query.stock[1] + '&like=true', function(error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        if (!JSON.parse(body)[error]) {
                                            const secondgetStock = JSON.parse(body)['stockData'];
                                            const relative = firstgetStock.likes - secondgetStock.likes;
                                            res.json({
                                                "stockData": [{ "stock": firstgetStock.stock, "price": firstgetStock.price, "rel_likes": firstgetStock.likes - relative },
                                                    { "stock": secondgetStock.stock, "price": secondgetStock.price, "rel_likes": secondgetStock.likes - relative }
                                                ]
                                            })
                                        } else {
                                            res.json(JSON.parse(body)[error])
                                        }
                                    }
                                })
                            } else {
                                res.json(JSON.parse(body)[error])
                            }
                        }
                    })
                }
            }
        });
};