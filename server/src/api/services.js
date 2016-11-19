import firebase from 'firebase';
import kue from 'kue';

module.exports = {
  /**
   * Fisher-Yates (aka Knuth) Shuffle.
   * @param  {[type]} array Array of accounts.
   * @return {[type]}       Returns an array of randomized accounts.
   */
  shuffle: function(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  },

  /**
   * Creates groups of n chucks
   * @param  {[type]} array Array of accounts.
   * @return {[type]}       Array of trade groups.
   */
  createTradeGroups: function(array) {
    let i,j,temparray;
    let result = [];
    let chunk = 25;
    for (i = 0, j = array.length; i < j; i += chunk) {
      temparray = array.slice(i, i + chunk);
      result.push(temparray);
    }
    return result;
  },

  /**
   * [createAccountKues description]
   * @param  {[type]} array [description]
   * @return {[type]}       [description]
   */
  createAccountKues: function(array) {
    for (let i = 0; i < array.length; ++i) {
      let tradeGroup = array[i];
      for (let j = 0; j < tradeGroup.length; ++j) {
        let accountKey = tradeGroup[j];
        let tradeGroupTemp = tradeGroup.slice(0);

        tradeGroupTemp.splice(j,1);

        let ranTradeGroup = this.shuffle(tradeGroupTemp);

        let postData = {};
        for (var i = 0; i < ranTradeGroup.length; ++i) {
          postData[ranTradeGroup[i]] = i;
        }

        // Save in database
        let updates = {};
        updates['/activeTrades/' + accountKey + '/trades/'] = postData;
        firebase.database().ref().update(updates);

        // Process in Kue
        setupAccountKue(accountKey, ranTradeGroup);
      }
    }

    /**
     * [setupAccountKue description]
     * @param  {[type]} accountKey     [description]
     * @param  {[type]} tradeGroupTemp [description]
     * @return {[type]}                [description]
     */
    function setupAccountKue(accountKey, ranTradeGroup) {
      let queue = kue.createQueue();

      // Queues each trade as a new job
      // let jobTimeStart = -1200000;
      let jobTimeStart = -60000;

      for (let i = 0; i < ranTradeGroup.length; ++i) {
        // Each job can only start 20 mins after the previous one
        // jobTimeStart += 1200000;
        jobTimeStart += 60000;

        let job = queue.create(accountKey, {
            title: 'Trading with: ' + ranTradeGroup[i],
            tradeAccountKey: ranTradeGroup[i]
        })
        .delay(jobTimeStart) // 20 mins
        .attempts(2)
        .save(function(err) {
           if( !err ) {
             console.log( job.id );
           }
        });
      }
    }
  },

  /**
   * [processKue description]
   * @param  {[type]} accountKey [description]
   * @return {[type]}            [description]
   */
  processKue: function(accountKey) {
    let queue = kue.createQueue();
    queue.process(accountKey, function(job, done){
      // Execute job
      // if(!isValidEmail(address)) {
      //   return done(new Error('invalid to address'));
      // }

      Promise.all([getAccountOAuth(accountKey), getAccountSpotKey(job.data.tradeAccountKey)])
      .then(function(snapshot) {
        let oauthData = snapshot[0].val();
        let spotKey = snapshot[1].val();
        if (spotKey != null) {
          spotKey = Object.keys(spotKey);
        }

        console.log(oauthData);
        console.log(spotKey);
        console.log("");
        done();
      });
    });

    /**
     * [getAccountOAuth description]
     * @param  {[type]} accountKey [description]
     * @return {[type]}            [description]
     */
    function getAccountOAuth(accountKey) {
      // Query account OAuth info for trade.
      let accountRef = firebase.database().ref("/accounts/" + accountKey + "/accOAuth/");
      return accountRef.once("value", function(snapshot) {
        return snapshot;
      });
    }

    /**
     * [getAccountSpots description]
     * @param  {[type]} tradeAccountKey [description]
     * @return {[type]}                 [description]
     */
    function getAccountSpotKey(tradeAccountKey) {
      // Query trade account spots for trade.
      let tradeAccountRef = firebase.database().ref("/accounts/" + tradeAccountKey + "/spots/");
      return tradeAccountRef.once("value", function(snapshot) {
        return snapshot;
      });
    }
  },

  /**
   * [Queries firebase to get all active trades or in a specified category]
   * @param  {[type]} category (optional) [string]
   * @return {[type]}                     [void]
   */
  getActiveTrades: function(category) {
    const ref = firebase.database().ref("activeTrades");
    if (category) {
      return ref.orderByChild("accCategory").equalTo(category).once("value", function(snapshot) {
        return snapshot.val();
      });
    } else {
      return ref.once("value", function(snapshot) {
        return snapshot.val();
      });
    }
  },

  /**
   * [queryAccounts description]
   * @param  {[type]} category (optional) [string]
   * @return {[type]}                     [description]
   */
  getAccounts: function(category) {
    const ref = firebase.database().ref("accounts");
    if (category) {
      return ref.orderByChild("accCategory").equalTo(category).once("value", function (snapshot) {
        return snapshot;
      });
    } else {
      return ref.once("value", function (snapshot) {
        return snapshot;
      });
    }
  },
};
