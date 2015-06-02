/**
 * Created by Matloob on 4/7/2014.
 */

"use strict";

var request = require('request'),
    async   = require('async'),
    q       = require('q');

var authURL  = "https://dashboard.movable.com/oauth/authorize";
var tokenURL = "https://dashboard.movable.com/oauth/token";
var apiURL   = "https://api.movable.com/v2";

var clientID,
    clientSecret,
    callbackURL,
    scope = "public+activity";


function MovableClient(appId, secret, redirectURI) {

    clientID = appId;
    clientSecret = secret;
    callbackURL = redirectURI;

}

MovableClient.prototype.getRequestToken = function(res) {

    var url = authURL + "?client_id=" + clientID + "&redirect_uri=" + callbackURL + "&scope=" + scope + "&response_type=code";
    res.redirect(url);
};

MovableClient.prototype.getAccessToken = function(code){

    var deferred = q.defer();

    var options = {
            method: 'POST',
            form: {
                client_id: clientID,
                client_secret: clientSecret,
                redirect_uri: callbackURL,
                grant_type: "authorization_code",
                code: code
            },
            url: tokenURL
        };

    request(options, function (error, response, body) {
        if (error) {
            deferred.reject(error);
        } else if (response.statusCode == 200) {

            var accessToken = JSON.parse(body).access_token;

            deferred.resolve(accessToken);
        } else {
            deferred.reject(new Error("Status Code = " + response.statusCode));
        }

    });

    return deferred.promise;
};

MovableClient.prototype.getUserProfile = function(accessToken){
    var deferred = q.defer();

    async.waterfall([
        function(callback){
            var options = {
                url: tokenURL + "/info?access_token=" + accessToken
            };

            request(options, function (error, response, body) {
                if (error) return callback(error);

                if (response.statusCode == 200) {
                    var userId  = JSON.parse(body).resource_owner_id;

                    callback(null, accessToken, userId);

                } else {
                    callback(new Error("Status Code = " + response.statusCode));
                }

            });
        },
        function(accessToken, userId, callback){
            var options = {
                url: apiURL + "/users/" + userId,
                headers: {
                    Authorization: "Bearer " + accessToken
                }
            };

            request(options, function (error, response, body) {
                if (error) return callback(error);

                if (response.statusCode == 200) {
                    var profile = JSON.parse(body);

                    callback(null, profile);
                }  else {
                    callback(new Error("Status Code = " + response.statusCode));
                }
            });

        }
    ], function (err, profile){
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(profile);
        }
    });

    return deferred.promise;
};

MovableClient.prototype.getActivities = function(accessToken, userId, fromDate, toDate, grouping) {
    var deferred = q.defer();

    var options = {
        url: apiURL + "/users/" + userId + "/activities?from=" + fromDate + "&to=" + toDate + "&grouping=" + grouping,
        headers: {
            Authorization: "Bearer " + accessToken
        }
    };

    request(options, function (error, response, body) {
        if (error) {
            deferred.reject(error);
        } else if (response.statusCode == 200) {
            var activities = JSON.parse(body) || [];

            deferred.resolve(activities);
        } else {
            deferred.reject(new Error("Status Code = " + response.statusCode));
        }
    });

    return deferred.promise;
};

module.exports = MovableClient;
