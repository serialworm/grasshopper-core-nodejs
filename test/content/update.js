var should = require('chai').should();

describe('Grasshopper core - content', function(){
    'use strict';

    var async = require('async'),
        path = require('path'),
        _ = require('underscore'),
        grasshopper = require('../../lib/grasshopper'),
        testContentId  = '5261781556c02c072a000007',
        tokens = {},
        restrictedContentId = '5254908d56c02c076e000001',
        sampleContentObject = null,
        tokenRequests = [
            ['apitestuseradmin', 'TestPassword', 'globalAdminToken'],
            ['apitestuserreader', 'TestPassword', 'globalReaderToken'],
            ['apitestusereditor_restricted', 'TestPassword', 'restrictedEditorToken'],

            // There are no tests for the following:
            ['apitestusereditor', 'TestPassword', 'globalEditorToken'],
            ['apitestuserreader_1', 'TestPassword', 'nodeEditorToken']
        ],
        parallelTokenRequests = [];

    before(function(done){
        grasshopper.configure(function(){
            this.config = {
                'crypto': {
                    'secret_passphrase' : '223fdsaad-ffc8-4acb-9c9d-1fdaf824af8c'
                },
                'db': {
                    'type': 'mongodb',
                    'host': 'mongodb://localhost:27017/test',
                    'database': 'test',
                    'username': '',
                    'password': '',
                    'debug': false
                },
                'assets': {
                    'default' : 'local',
                    'tmpdir' : path.join(__dirname, 'tmp'),
                    'engines': {
                        'local' : {
                            'path' : path.join(__dirname, 'public'),
                            'urlbase' : 'http://localhost'
                        }
                    }
                }
            };
        });

        _.each(tokenRequests, function(theRequest) {
            parallelTokenRequests.push(createGetToken(theRequest[0], theRequest[1], theRequest[2]).closure);
        });
        async.parallel(parallelTokenRequests, createSampleContent.bind(null, done));

    });

    function createSampleContent(done) {
        grasshopper
            .request(tokens.globalReaderToken)
            .content.getById(testContentId).then(function(payload){
                sampleContentObject = payload;
            }).done(done);
    }

    describe('update', function() {
        it('should return 401 because trying to access unauthenticated', function(done) {
            var obj = {};
            _.extend(obj, sampleContentObject);

            obj.fields.newColumn = 'newValue';

            grasshopper.request().content.update(obj).then(
                function(payload){
                    should.not.exist(payload);
                },
                function(err){
                    err.code.should.equal(401);
                }
            ).done(done);
        });

        it('should return 403 because I am am only a reader of content.', function(done) {

            var obj = {};
            _.extend(obj, sampleContentObject);

            obj.fields.newColumn = 'newValue';

            grasshopper.request(tokens.globalReaderToken).content.update(obj).then(
                function(payload){
                    should.not.exist(payload);
                },
                function(err){
                    err.code.should.equal(403);
                }
            ).done(done);
        });

        it('should return 200 because I have the correct permissions.', function(done) {
            var obj = {};
            _.extend(obj, sampleContentObject);

            obj.fields.newColumn = 'newValue';

            grasshopper.request(tokens.globalEditorToken).content.update(obj).then(
                function(payload){
                    payload.fields.newColumn.should.equal('newValue');
                },
                function(err){
                    should.not.exist(err);
                }
            ).done(done);
        });

        it('should return 403 because I am trying to update content in a node that is restricted to me.',
            function(done) {
            var obj = {};
            _.extend(obj, sampleContentObject);

            obj._id = restrictedContentId;
            obj.fields.newColumn = 'newValue';

            grasshopper.request(tokens.restrictedEditorToken).content.update(obj).then(
                function(payload){
                    should.not.exist(payload);
                },
                function(err){
                    err.code.should.equal(403);
                }
            ).done(done);
        });
    });

    function createGetToken(username, password, storage) {
        return {
            closure : function getToken(cb){
                grasshopper.auth(username, password).then(function(token){
                    tokens[storage] = token;
                    cb();
                }).done();
            }
        };
    }
});
