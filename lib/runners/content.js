module.exports = (function() {
    'use strict';

    var coordinator = require('./coordinator'),
        middleware = require('../middleware'),
        security = require('../security'),
        logger = require('../utils/logger');

    coordinator.use('content.update', [
        middleware.identity,
        middleware.nodes.setNodeIdFromArgument,
        middleware.nodes.requireNodePermissions(security.roles.AUTHOR),
        middleware.content.convertDateStrings,
        middleware.content.prepareEvent,
        middleware.event('parse'),
        middleware.event('validate'),
        middleware.content.validate,
        middleware.content.setComputedProperties,
        middleware.content.update,
        middleware.event('out'),
        middleware.event('save')
    ]);

    coordinator.use('content.insert', [
        middleware.identity,
        middleware.nodes.setNodeIdFromArgument,
        middleware.nodes.requireNodePermissions(security.roles.AUTHOR),
        middleware.content.convertDateStrings,
        middleware.content.prepareEvent,
        middleware.event('parse'),
        middleware.event('validate'),
        middleware.content.validate,
        middleware.content.setComputedProperties,
        middleware.content.insert,
        middleware.event('out'),
        middleware.event('save')
    ]);

    coordinator.use('content.query', [
        middleware.identity,
        middleware.role(security.roles.READER),
        middleware.content.query,
        middleware.event('out')
    ]);

    coordinator.use('content.deleteById', [
        middleware.identity,
        middleware.content.setTempContent,
        middleware.nodes.requireNodePermissions(security.roles.AUTHOR),
        middleware.content.setEventFiltersFromTempContent,
        middleware.event('parse'),
        middleware.event('validate'),
        middleware.content.deleteById,
        middleware.event('out'),
        middleware.event('delete')
    ]);

    coordinator.use('content.getById', [
        middleware.identity,
        middleware.content.setTempContent,
        middleware.nodes.requireNodePermissions(security.roles.READER),
        middleware.content.setEventFiltersFromTempContent,
        middleware.event('parse'),
        middleware.event('validate'),
        middleware.content.setContentPayload,
        middleware.event('out')
    ]);

    return function users(kontx){
        return {
            insert: function(content){
                return coordinator.handle('content.insert', content, kontx);
            },
            deleteById: function(id){
                return coordinator.handle('content.deleteById', [id], kontx);
            },
            getById: function(id){
                return coordinator.handle('content.getById', {id:id}, kontx);
            },
            query: function(criteria){
                return coordinator.handle('content.query', criteria, kontx);
            },
            update: function(content){
                return coordinator.handle('content.update', content, kontx);
            },
            list: function(options){
                return coordinator.handle('content.list', [options], kontx);
            }
        };
    };
})();
