JsonRoutes.Middleware.use(
  '/api/*',
  oAuth2Server.oauthserver.authorise()   // OAUTH FLOW - A7.1
);





// this is temporary fix until PR 132 can be merged in
// https://github.com/stubailo/meteor-rest/pull/132

JsonRoutes.sendResult = function (res, options) {
  options = options || {};

  // Set status code on response
  res.statusCode = options.code || 200;

  // Set response body
  if (options.data !== undefined) {
    var shouldPrettyPrint = (process.env.NODE_ENV === 'development');
    var spacer = shouldPrettyPrint ? 2 : null;
    res.setHeader('Content-type', 'application/fhir+json');
    res.write(JSON.stringify(options.data, null, spacer));
  }

  // We've already set global headers on response, but if they
  // pass in more here, we set those.
  if (options.headers) {
    //setHeaders(res, options.headers);
    options.headers.forEach(function(value, key){
      res.setHeader(key, value);
    });
  }

  // Send the response
  res.end();
};

JsonRoutes.setResponseHeaders({
  "content-type": "application/fhir+json"
});


JsonRoutes.add("get", "/fhir-1.6.0/Practitioner/:id", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Practitioner/' + req.params.id);

  res.setHeader("Access-Control-Allow-Origin", "*");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

  if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

    if (accessToken) {
      process.env.TRACE && console.log('accessToken', accessToken);
      process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
    }

    // if (typeof SiteStatistics === "object") {
    //   SiteStatistics.update({_id: "configuration"}, {$inc:{
    //     "Practitioners.count.read": 1
    //   }});
    // }

    var practitionerData = Practitioners.findOne({_id: req.params.id});
    if (practitionerData) {
      practitionerData.id = practitionerData._id;

      delete practitionerData._document;
      delete practitionerData._id;

      process.env.TRACE && console.log('practitionerData', practitionerData);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: Practitioners.prepForFhirTransfer(practitionerData)
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 410
      });
    }
  } else {
    JsonRoutes.sendResult(res, {
      code: 401
    });
  }
});


JsonRoutes.add("get", "/fhir-1.6.0/Practitioner/:id/_history", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Practitioner/' + req.params.id);
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Practitioner/' + req.query._count);

  res.setHeader("Access-Control-Allow-Origin", "*");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

  if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

    if (accessToken) {
      process.env.TRACE && console.log('accessToken', accessToken);
      process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
    }

    // if (typeof SiteStatistics === "object") {
    //   SiteStatistics.update({_id: "configuration"}, {$inc:{
    //     "Practitioners.count.read": 1
    //   }});
    // }

    var practitioners = Practitioners.find({_id: req.params.id});
    var payload = [];

    practitioners.forEach(function(record){
      payload.push(Practitioners.prepForFhirTransfer(record));
    });

    JsonRoutes.sendResult(res, {
      code: 200,
      data: Bundle.generate(payload, 'history')
    });
  } else {
    JsonRoutes.sendResult(res, {
      code: 401
    });
  }
});

JsonRoutes.add("put", "/fhir-1.6.0/Practitioner/:id", function (req, res, next) {
  process.env.DEBUG && console.log('PUT /fhir-1.6.0/Practitioner/' + req.params.id);
  process.env.DEBUG && console.log('PUT /fhir-1.6.0/Practitioner/' + req.query._count);

  res.setHeader("Access-Control-Allow-Origin", "*");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

  if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

    if (accessToken) {
      process.env.TRACE && console.log('accessToken', accessToken);
      process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
    }

    // if (typeof SiteStatistics === "object") {
    //   SiteStatistics.update({_id: "configuration"}, {$inc:{
    //     "Practitioners.count.read": 1
    //   }});
    // }

    if (req.body) {
      practitionerUpdate = req.body;

      // remove id and meta, if we're recycling a resource
      delete req.body.id;
      delete req.body.meta;

      //process.env.TRACE && console.log('req.body', req.body);

      practitionerUpdate.resourceType = "Practitioner";
      practitionerUpdate = Practitioners.toMongo(practitionerUpdate);

      //process.env.TRACE && console.log('practitionerUpdate', practitionerUpdate);


      practitionerUpdate = Practitioners.prepForUpdate(practitionerUpdate);


      process.env.DEBUG && console.log('-----------------------------------------------------------');
      process.env.DEBUG && console.log('practitionerUpdate', JSON.stringify(practitionerUpdate, null, 2));
      // process.env.DEBUG && console.log('newPractitioner', newPractitioner);

      var practitioner = Practitioners.findOne(req.params.id);
      var practitionerId;

      if(practitioner){
        process.env.DEBUG && console.log('Practitioner found...')
        practitionerId = Practitioners.update({_id: req.params.id}, {$set: practitionerUpdate },  function(error, result){
          if (error) {
            //console.log('PUT /fhir/Practitioner/' + req.params.id + "[error]", error);
            JsonRoutes.sendResult(res, {
              code: 400
            });
          }
          if (result) {
            process.env.TRACE && console.log('result', result);
            res.setHeader("Location", "fhir/Practitioner/" + result);
            res.setHeader("Last-Modified", new Date());
            res.setHeader("ETag", "1.6.0");

            var practitioners = Practitioners.find({_id: req.params.id});
            var payload = [];

            practitioners.forEach(function(record){
              payload.push(Practitioners.prepForFhirTransfer(record));
            });

            console.log("payload", payload);

            JsonRoutes.sendResult(res, {
              code: 200,
              data: Bundle.generate(payload)
            });
          }
        });
      } else {        
        process.env.DEBUG && console.log('No practitioner found.  Creating one.')
        practitionerId = Practitioners.insert(practitionerUpdate,  function(error, result){
          if (error) {
            process.env.TRACE && console.log('PUT /fhir/Practitioner/' + req.params.id + "[error]", error);
            JsonRoutes.sendResult(res, {
              code: 400
            });
          }
          if (result) {
            process.env.TRACE && console.log('result', result);
            res.setHeader("Location", "fhir/Practitioner/" + result);
            res.setHeader("Last-Modified", new Date());
            res.setHeader("ETag", "1.6.0");

            var practitioners = Practitioners.find({_id: req.params.id});
            var payload = [];

            practitioners.forEach(function(record){
              payload.push(Practitioners.prepForFhirTransfer(record));
            });

            console.log("payload", payload);

            JsonRoutes.sendResult(res, {
              code: 200,
              data: Bundle.generate(payload)
            });
          }
        });        
      }
    } else {
      JsonRoutes.sendResult(res, {
        code: 422
      });

    }


  } else {
    JsonRoutes.sendResult(res, {
      code: 401
    });
  }
});


generateDatabaseQuery = function(query){
  console.log("generateDatabaseQuery", query);

  var databaseQuery = {};

  if (query.family) {
    databaseQuery['name'] = {
      $elemMatch: {
        'family': query.family
      }
    };
  }
  if (query.given) {
    databaseQuery['name'] = {
      $elemMatch: {
        'given': query.given
      }
    };
  }
  if (query.name) {
    databaseQuery['name'] = {
      $elemMatch: {
        'text': {
          $regex: query.name,
          $options: 'i'
        }
      }
    };
  }
  if (query.identifier) {
    databaseQuery['identifier'] = {
      $elemMatch: {
        'value': query.identifier
      }
    };
  }
  if (query.gender) {
    databaseQuery['gender'] = query.gender;
  }
  if (query.birthdate) {
    var dateArray = query.birthdate.split("-");
    var minDate = dateArray[0] + "-" + dateArray[1] + "-" + (parseInt(dateArray[2])) + 'T00:00:00.000Z';
    var maxDate = dateArray[0] + "-" + dateArray[1] + "-" + (parseInt(dateArray[2]) + 1) + 'T00:00:00.000Z';
    console.log("minDateArray", minDate, maxDate);

    databaseQuery['birthDate'] = {
      "$gte" : new Date(minDate),
      "$lt" :  new Date(maxDate)
    };
  }

  process.env.DEBUG && console.log('databaseQuery', databaseQuery);
  return databaseQuery;
}

JsonRoutes.add("get", "/fhir-1.6.0/Practitioner", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Practitioner', req.query);
  // console.log('GET /fhir/Practitioner', req.query);
  // console.log('process.env.DEBUG', process.env.DEBUG);

  res.setHeader("Access-Control-Allow-Origin", "*");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

  if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

    if (accessToken) {
      process.env.TRACE && console.log('accessToken', accessToken);
      process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
    }

    // if (typeof SiteStatistics === "object") {
    //   SiteStatistics.update({_id: "configuration"}, {$inc:{
    //     "Practitioners.count.search-type": 1
    //   }});
    // }

    var databaseQuery = generateDatabaseQuery(req.query);

    //process.env.DEBUG && console.log('Practitioners.find(id)', Practitioners.find(databaseQuery).fetch());

    // var searchLimit = 1;
    // var practitionerData = Practitioners.fetchBundle(databaseQuery);

    var payload = [];
    var practitioners = Practitioners.find(databaseQuery);

    practitioners.forEach(function(record){
      payload.push(Practitioners.prepForFhirTransfer(record));
    });


    JsonRoutes.sendResult(res, {
      code: 200,
      data: Bundle.generate(payload)
    });
  } else {
    JsonRoutes.sendResult(res, {
      code: 401
    });
  }
});

// This is actually a search function
JsonRoutes.add("post", "/fhir-1.6.0/Practitioner/:param", function (req, res, next) {
  process.env.DEBUG && console.log('POST /fhir-1.6.0/Practitioner/' + JSON.stringify(req.query));

  res.setHeader("Access-Control-Allow-Origin", "*");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

  if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

    if (accessToken) {
      process.env.TRACE && console.log('accessToken', accessToken);
      process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
    }

    var practitioners = [];

    if (req.params.param.includes('_search')) {
      var searchLimit = 1;
      if (req && req.query && req.query._count) {
        searchLimit = parseInt(req.query._count);
      }

      var databaseQuery = generateDatabaseQuery(req.query);
      process.env.DEBUG && console.log('databaseQuery', databaseQuery);

      practitioners = Practitioners.find(databaseQuery, {limit: searchLimit});

      var payload = [];

      practitioners.forEach(function(record){
        payload.push(Practitioners.prepForFhirTransfer(record));
      });
    }

    //process.env.TRACE && console.log('practitioners', practitioners);

    JsonRoutes.sendResult(res, {
      code: 200,
      data: Bundle.generate(payload)
    });
  } else {
    JsonRoutes.sendResult(res, {
      code: 401
    });
  }
});



JsonRoutes.add("post", "/fhir-1.6.0/Practitioner", function (req, res, next) {
  //process.env.DEBUG && console.log('POST /fhir/Practitioner/', JSON.stringify(req.body, null, 2));

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

  if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

    if (accessToken) {
      process.env.TRACE && console.log('accessToken', accessToken);
      process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
    }

    var practitionerId;
    var newPractitioner;

    if (req.body) {
      newPractitioner = req.body;

      // remove id and meta, if we're recycling a resource
      delete newPractitioner.id;
      delete newPractitioner.meta;

      if (newPractitioner.birthDate) {
        newPractitioner.birthDate = moment(newPractitioner.birthDate);
      }

      newPractitioner = Practitioners.toMongo(newPractitioner);

      process.env.DEBUG && console.log('newPractitioner', JSON.stringify(newPractitioner, null, 2));
      // process.env.DEBUG && console.log('newPractitioner', newPractitioner);

      var practitionerId = Practitioners.insert(newPractitioner,  function(error, result){
        if (error) {
          JsonRoutes.sendResult(res, {
            code: 400
          });
        }
        if (result) {
          process.env.TRACE && console.log('result', result);
          res.setHeader("Location", "fhir-1.6.0/Practitioner/" + result);
          res.setHeader("Last-Modified", new Date());
          res.setHeader("ETag", "1.6.0");

          var practitioners = Practitioners.find({_id: result});
          var payload = [];

          practitioners.forEach(function(record){
            payload.push(Practitioners.prepForFhirTransfer(record));
          });

          //console.log("payload", payload);

          JsonRoutes.sendResult(res, {
            code: 201,
            data: Bundle.generate(payload)
          });
        }
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 422
      });

    }

  } else {
    JsonRoutes.sendResult(res, {
      code: 401
    });
  }
});



JsonRoutes.add("delete", "/fhir-1.6.0/Practitioner/:id", function (req, res, next) {
  process.env.DEBUG && console.log('DELETE /fhir-1.6.0/Practitioner/' + req.params.id);

  res.setHeader("Access-Control-Allow-Origin", "*");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

  if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

    if (accessToken) {
      process.env.TRACE && console.log('accessToken', accessToken);
      process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
    }

    if (Practitioners.find({_id: req.params.id}).count() === 0) {
      JsonRoutes.sendResult(res, {
        code: 410
      });
    } else {
      Practitioners.remove({_id: req.params.id}, function(error, result){
        if (result) {
          JsonRoutes.sendResult(res, {
            code: 204
          });
        }
        if (error) {
          JsonRoutes.sendResult(res, {
            code: 409
          });
        }
      });
    }


  } else {
    JsonRoutes.sendResult(res, {
      code: 401
    });
  }
});





// WebApp.connectHandlers.use("/fhir/Practitioner", function(req, res, next) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   return next();
// });
