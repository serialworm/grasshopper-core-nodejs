module.exports = (function(){
    'use strict';

    var crud            = require('./mixins/crud'),
        filterFactory   = require('./search/filterFactory'),
        find            = require('./mixins/find'),
        findDistinct    = require('./mixins/findDistinct'),
        schema          = require('./schemas/content'),
        _               = require('underscore'),
        async           = require('async'),
        mongoose        = require('mongoose'),
        q               = require('q'),
        collectionName  = 'content',
        content = Object.create(crud, {
            model: {value: mongoose.model(collectionName, schema)}
        });

    function buildCollection(key, value, queryRef){
        var obj = {};

        if(value && value instanceof Array && value.length > 0){
            obj['meta.' + key] = {$in: value};
        }
        else if(value && typeof value === 'string' && value.length > 0){
            obj['meta.' + key] = value;
        }

        _.extend(queryRef, obj);
    }

    function buildQuery(nodes, types, filters, options, content){
        var query = {};

        buildCollection('node', nodes, query);
        buildCollection('type', types, query);
        filterFactory.createQuery(filters, query);


        if (options.distinct) {
            query.run = findDistinct.bind(query, nodes, types, filters, options, content);
        } else {
            query.run = find.bind(query, nodes, types, filters, options, content);
        }

        return query;
    }

    content.updateLabelField = function(type, fieldname){
        var deferred = q.defer();

        this.model.update( { 'meta.type': type } , { $set: { 'meta.labelfield': fieldname } } , { multi:true } )
            .exec(function(err, data){
                if(err){
                    deferred.reject(err);
                    return;
                }

                deferred.resolve({result: true});
            });

        return deferred.promise;
    };

    content.query = function(nodes, types, filters, options){
        return buildQuery(nodes, types, filters, options, this).run();
    };

    return content;
})();