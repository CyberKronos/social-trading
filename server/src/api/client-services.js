import firebase from 'firebase';
import config from '../config.json';
import passport from 'passport';
import TwitterStrategy from 'passport-twitter';
import InstagramStrategy from 'passport-instagram';

// Passport.js Init
passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
    callbackURL: "http://127.0.0.1:8080/api/auth/twitter/callback",
    userAuthorizationURL: "https://api.twitter.com/oauth/authenticate?force_login=true"
  },
  function(token, tokenSecret, profile, done) {
    let userData = {
      token: token,
      tokenSecret: tokenSecret,
      profileData: profile
    };
    storeTwitterUser(userData);
    return done(userData);
  }
));

passport.use(new InstagramStrategy({
    clientID: config.instagram.clientId,
    clientSecret: config.instagram.clientSecret,
    callbackURL: "http://127.0.0.1:8080/api/auth/instagram/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    let userData = {
      accessToken: accessToken,
      profileData: profile._json.data
    };
    storeInstagramUser(userData);
    return done(userData);
  }
));

/**
 * Private Functions
 */
/**
 * TODO: Implement function
 * [storeTwitterUser description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
function storeTwitterUser(data) {
  console.log(data);
}

/**
 * TODO: Implement function
 * [storeInstagramUser description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
function storeInstagramUser(data) {
  console.log(data);
}
