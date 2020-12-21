var SpotifyWebApi = require('spotify-web-api-node');
var querystring = require('querystring');

var client_id = '';
var client_secret = '';
var redirect_uri = '';
var stateKey = 'spotify_auth_state';


//Spotify Login
module.exports.spotifyLogin = function (res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    // your application requests authorization
    var scope = 'user-read-email user-read-recently-played';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
};

var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirect_uri
});

//Spotify callback + sessions
module.exports.spotifyCallback = function (req, res) {
    spotifyApi.authorizationCodeGrant(req.query.code).then(function(data) {
        spotifyApi.setAccessToken(data.body.access_token);
        spotifyApi.setRefreshToken(data.body.refresh_token);
        return spotifyApi.getMe()

    }).then(function(data) {
        spotifyApi.getMyRecentlyPlayedTracks({
            limit: 50
        }).then(function(data) {
            var arr = [], songIDs = [];
            data.body.items.forEach(function(p) {
                var obj = {
                    id: p.track.id,
                    name: p.track.name
                };

                arr.push(obj);
                songIDs.push(p.track.id);

            });
            spotifyApi.getAudioFeaturesForTracks(songIDs).then(function(data) {

                var danceability = 0, loudness = 0, valence = 0, tempo = 0, mode = 0, energy = 0, speechiness = 0,
                    acousticness = 0, instrumentalness = 0, liveness = 0;

                data.body.audio_features.forEach(function(p1, p2, p3) {
                    danceability += p1.danceability;
                    loudness += p1.loudness;
                    valence += p1.valence;
                    tempo += p1.tempo;
                    mode += p1.mode;
                    energy += p1.energy;
                    speechiness += p1.speechiness;
                    acousticness += p1.acousticness;
                    instrumentalness += p1.instrumentalness;
                    liveness += p1.liveness;
                });
                var obj = {
                    danceability: danceability / data.body.audio_features.length,
                    loudness: loudness / data.body.audio_features.length,
                    valence: valence / data.body.audio_features.length,
                    tempo: tempo / data.body.audio_features.length,
                    mode: Math.round(mode / data.body.audio_features.length),
                    energy: energy / data.body.audio_features.length,
                    speechiness: speechiness / data.body.audio_features.length,
                    acousticness: acousticness / data.body.audio_features.length,
                    instrumentalness: instrumentalness / data.body.audio_features.length,
                    liveness: liveness / data.body.audio_features.length
                };
                req.session.obj = obj;
                res.redirect('/musicScape');
            });
        });
        req.session.user = data.body.id.length > 10? data.body.display_name : data.body.id;
    });
};