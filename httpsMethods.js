const https = require('https');

universalRequest = (options, postData = false) => {
	return new Promise(resolve => {
	  const req = https.request(options, res => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        resolve('ERROR: ' + res.statusCode);
        res.resume();
      } else {
        let bodyResponse = '';
        res.on('data', chunk => bodyResponse += chunk);
        res.on('end', () => {
          const result = JSON.parse(bodyResponse);
          if (result) {
            resolve(result);
          } else {
            resolve('ERROR: No data sent back');
          }
        });
      }
    });
    
    req.on('error', (_) => {
      resolve('ERROR: problem with request');
    });

		if (postData) {
    	req.write(postData);
		}
		
    req.end();
	});
};

module.exports.getRequest = (hostname, path) => {
  const getOptions = {
    method: 'GET',
    hostname,
    path,
  };

  return universalRequest(getOptions);
};

module.exports.postJsonRequest = (hostname, path, postData) => {
  const postOptions = {
    method: 'POST',
    hostname,
    path,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  return universalRequest(postOptions, postData);
};

module.exports.putJsonRequest = (hostname, path, putData) => {
  const putOptions = {
    method: 'PUT',
    hostname,
    path,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': putData.length
    }
  };

  return universalRequest(putOptions, putData);

};

module.exports.deleteRequest = (hostname, path) => {
  const deleteOptions = {
    method: 'DELETE',
    hostname,
    path,
  };

  return universalRequest(deleteOptions);
};
