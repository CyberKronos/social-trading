import { version } from '../../package.json';
import { Router } from 'express';
import facets from './facets';
import config from '../config.json';
import services from './services'
import firebase from 'firebase';
// import Twit from 'twit';
// import Queue from 'bull';

// Firebase Init
const firebaseConfig = {
	apiKey: config.firebase.apiKey,
	authDomain: config.firebase.authDomain,
	databaseURL: config.firebase.databaseURL
};
firebase.initializeApp(firebaseConfig);

export default ({ config, db }) => {
	let api = Router();

	// mount the facets resource
	api.use('/facets', facets({ config, db }));

	api.get('/', (req, res) => {
		return res.json({ version });
	});

	// perhaps expose some API metadata at the root

	/**
	 * [accs description]
	 * @type {Array}
	 */
  api.get('/createAccountQueues', (req, res) => {
		Promise.resolve(services.getAccounts())
    .then(function(dataSnapshot) {
			let accs = [];

      dataSnapshot.forEach(function (childSnapshot) {
        accs.push(childSnapshot.key);
      });

			let randomizedAccs = services.shuffle(accs);
			let groups = services.createTradeGroups(randomizedAccs);
			services.createAccountQueues(groups);
    });

    return res.json({ version });
  });

  /**
   * Process and starts trading the Kues
   * @type GET
   */
  api.get('/processKueAndStartTrading', (req, res) => {
		Promise.resolve(services.getActiveTrades())
		.then(function(dataSnapshot) {
			console.log(dataSnapshot.val());
		});
	});
  // api.get('/updateQueueAndStartTrading', (req, res) => {
  //   /*global Promise Promise:true*/
  //   Promise.all([getAllActiveTrades()])
  //   .then(function(snapshot) {
  //     const allTradeLists = snapshot[0].val();
	//
  //     /* Add condition if there are active trades going on then terminate */
	//
  //     for (let accountKey in allTradeLists) {
  //       // Creates a queue for each account at localhost:6379
  //       const tradeQueue = Queue(accountKey);
	//
  //       // Processes the function to be executed on the queue
  //       tradeQueue.process(function(jobData, done) {
  //         // Extract Tweet IDs from URLs
  //         const adUrl = jobData.data.adUrl;
  //         const regOneUrl = jobData.data.regOneUrl;
  //         const regTwoUrl = jobData.data.regTwoUrl;
	//
  //         const adUrlArr = adUrl.split("/");
  //         const regOneUrlArr = regOneUrl.split("/");
  //         const regTwoUrlArr = regTwoUrl.split("/");
	//
  //         const adId = adUrlArr[adUrlArr.length-1];
  //         const regOneId = regOneUrlArr[regOneUrlArr.length-1];
  //         const regTwoId = regTwoUrlArr[regTwoUrlArr.length-1];
	//
  //         // Creates a new Twit object
  //         const T = new Twit({
  //           consumer_key: config.twitter.consumerKey,
  //           consumer_secret: config.twitter.consumerSecret,
  //           access_token: jobData.data.accOAuth.accessToken,
  //           access_token_secret: jobData.data.accOAuth.accessTokenSecret
  //         });
	//
  //         // Retweeting the spots - order matters
  //         // Reg spot #1
  //         T.post('statuses/retweet/:id', { id: regOneId }, function (err, data, response) {
  //           if (err) {
  //             console.log(err.message + " reg spot 1");
  //             done(Error(err.message));
  //           } else {
  //             console.log('retweeted spot 1');
  //             jobData.progress(16);
  //             // Reg spot #2
  //             T.post('statuses/retweet/:id', { id: regTwoId }, function (err, data, response) {
  //               if (err) {
  //                 console.log(err.message + " reg spot 2");
  //                 done(Error(err.message));
  //               } else {
  //                 console.log('retweeted spot 2');
  //                 jobData.progress(32);
  //                 // Ad spot
  //                 T.post('statuses/retweet/:id', { id: adId }, function (err, data, response) {
  //                   if (err) {
  //                     console.log(err.message + " ad spot");
  //                     done(Error(err.message));
  //                   } else {
  //                     console.log('retweeted ad');
  //                     jobData.progress(48);
  //                   }
  //                 });
  //               }
  //             });
  //           }
  //         });
	//
  //         // Finish the job asynchronously after 19 mins is up
  //         setTimeout(function() {
  //           // Unretweet everything before moving to next task - order does not matter
  //           // Reg spot #1
  //           T.post('statuses/unretweet/:id', { id: regOneId }, function (err, data, response) {
  //             if (err) {
  //               console.log(err.message + " reg spot 1");
  //               done(Error(err.message));
  //             } else {
  //               console.log('unretweeted spot 1');
  //               jobData.progress(64);
  //             }
  //           });
	//
  //           // Reg spot #2
  //           T.post('statuses/unretweet/:id', { id: regTwoId }, function (err, data, response) {
  //             if (err) {
  //               console.log(err.message + " reg spot 2");
  //               done(Error(err.message));
  //             } else {
  //               console.log('unretweeted spot 2');
  //               jobData.progress(80);
  //             }
  //           });
	//
  //           // Ad spot
  //           T.post('statuses/unretweet/:id', { id: adId }, function (err, data, response) {
  //             if (err) {
  //               console.log(err.message + " ad spot");
  //               done(Error(err.message));
  //             } else {
  //               console.log('unretweeted ad');
  //               jobData.progress(100);
  //             }
  //           });
	//
  //           done();
  //         }, 1000 * 60); // 19 mins
  //       });
	//
  //       // Queues each trade as a new job
  //       let jobTimeStart = -1200000;
  //       const spotsInActiveTrades = allTradeLists[accountKey].spots;
  //       for (let spotKey in spotsInActiveTrades) {
  //         // Append accOAuth object to spot data in order to send it as one data object for job
  //         spotsInActiveTrades[spotKey]['accOAuth'] = allTradeLists[accountKey].accOAuth;
	//
  //         const jobData = spotsInActiveTrades[spotKey];
	//
  //         // Each job can only start 20 mins after the previous one
  //         jobTimeStart += 1200000;
  //         const options = {
  //           'attempts' : 2,
  //           'timeout' : 1000 * 60 * 25, // 20 mins
  //           'jobId' : spotKey,
  //           // 'delay' : jobTimeStart,
  //           'removeOnComplete' : true
  //         };
  //         tradeQueue.add(jobData, options);
  //       }
  //     }
	//
  //     return res.json({'status' : 'Trading has started!'});
  //   });
	// });

  api.get('/deleteAllActiveTrades', (req, res) => {
    Promise.all([getAllActiveTrades()])
    .then(function(snapshot) {
      const allTradeLists = snapshot[0].val();

      for (let accountKey in allTradeLists) {
        firebase.database().ref('/activeTrades/' + accountKey).child('spots').remove();
      }

      return res.json({'status' : 'All active trades deleted'});
    });
  });

  /**
   * Adds specified spot to the category trade list of accounts
   * @type POST
   */
  api.post('/addSpotToTrades', (req, res) => {
    const spotInfo = req.body;
    const spotKey = spotInfo.spotKey;

    Promise.all([getActiveTradesInCategory(spotInfo.accCategory)])
    .then(function(snapshots) {
      const tradeListsInCategory = snapshots[0].val();
      if (tradeListsInCategory == null) {
        // No accounts in category
        return res.json({'status' : 'No active trading accounts in this category'});
      } else {
        // For each account in the category, add the new spot to its' trade list
        for (let accountKey in tradeListsInCategory) {
          if (tradeListsInCategory.hasOwnProperty(accountKey)) {
            if (accountKey != spotInfo.accountKey) {
              const updates = {};
              spotInfo.approved = true;
              updates['/spots/' + spotKey + '/approved'] = true;
              updates['/activeTrades/' + accountKey + '/spots/' + spotKey] = spotInfo;
              updates['/tradeHistory/' + accountKey + '/' + spotKey] = spotInfo;
              firebase.database().ref().update(updates);
            }
          }
        }
        return res.json({'status' : 'Spot has been added to trades'});
      }
    });
	});

	return api;
}
