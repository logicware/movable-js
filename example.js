var express = require("express"),
	app = express();

var MovableClient   = require("./index.js"), // you would use require('movable-js');
    appId           = "appId",
    secret          = "secret",
    redirectURI     = "http://localhost:3000/auth/movable/callback",

    // create a client with your credentials
    client          = new MovableClient(appId, secret, redirectURI);


// Step 1
app.get("/authorize", function (req, res) {

    // takes the user to movable login page for authentication and hits the redirect URI with a code
    client.getRequestToken(res);

});

// Step 2
app.get("/auth/movable/callback", function (req, res) {

    // pass in the code delivered via url parameter named "code"
	client.getAccessToken(req.query.code).then(function (accessToken) {

        // pass in the accessToken received to get the user's profile data
		client.getUserProfile(accessToken).then(function (profile) {
            console.log(profile);

            // login this user

            // add accessToken to profile, add profile to req.user and save it

			res.send(profile);

		}, function (error) {
			res.send(error);
		});

	}, function (error) {
		res.send(error);
	});

});

// get users activities
app.get("/api/activities", function (req, res) {

    // get profile from req.user and get accessToken & userId from profile

    var accessToken = "accessToken",
        userId      = 1234,
        fromDate    = '2014-03-01',
        toDate      = '2014-03-31',
        grouping    = "daily";

    client.getActivities(accessToken, userId, fromDate, toDate, grouping).then(function (activities) {
        res.send(activities);

    }, function (error) {
        res.send(error);
    });
});

app.listen(3000);