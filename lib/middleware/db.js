/**
 * DB module will create a middleware from a simple db command. You can pass in a scope and function reference
 * and when the middleware is called it will execute the db.[func] method.
 * @param scope What is the "this" ?
 * @param func Function reference
 * @returns {Function} - Middleware
 */
module.exports = function db(scope, func) {
    'use strict';

    return function(kontx, next){
        var _ = require('underscore'),
            args = kontx.args;

        if(!_.isArray(kontx.args)){
            args = [kontx.args];
        }

        func.apply(scope, args).then(function(response){
                kontx.payload = response;
                next();
            }).fail(function(err){
                next(err);
            }).done();
    };
};