// Modules
const { once } = require('events');
const { createReadStream, createWriteStream } = require('fs');
const { createInterface } = require('readline');
const https = require('https');

// Format today's date
const formatDate = (date) => {
  const year = String(date.getUTCFullYear());
  let month = String(date.getUTCMonth() + 1);
  month = (month.length === 1) ? 0 + month : month;
  let day = String(date.getUTCDate());
  day = (day.length === 1) ? 0 + day : day;
  return year + '-' + month + '-' + day;
}

const today = formatDate(new Date());

// Parameters - Files
const INPUT_FILE = 'input.txt';
const INVALID_URL_FILE = today + '-invalid-urls.txt';
const VALID_URL_FILE = today + '-valid-urls.txt';

// Parameters - Jsonplaceholder
const VALID_URL_LENGTH = 43;

// Asynchronous function to read a file line by line.
// Returns a promise that resolves to a Set if the promise is fulfilled.
const processLineByLine = async (file) => {
  try {
    const rl = createInterface({
      input: createReadStream(file),
      crlfDelay: Infinity
    });

    const set = new Set();

    rl.on('line', (line) => {
      set.add(line);
    });

    await once(rl, 'close');

    console.log(`'${file}' file processed.`);

    return set;
  } catch (err) {
    console.error(err);
    return error;
  }
}

const saveSetInFile = async (set, file) => {
  try {
    const ws = createWriteStream(file);
    set.forEach((value) => {
        ws.write(`${value}\n`);
    });
    ws.end();
    console.log(`'${file}' file created: ${set.size} line(s) written.`)
  } catch (err) {
    console.error(err);
  }
}

const checkUrlFormat = (set) => {
  const validUrls = new Set();
  const invalidUrls = new Set();
  set.forEach(url => {
    if (url.length !== VALID_URL_LENGTH) {
      invalidUrls.add(url);
    } else {
      validUrls.add(url);
    }
  });
  if (invalidUrls.size > 0) {
    saveSetInFile(invalidUrls, INVALID_URL_FILE);
  }
  return validUrls;
};

const youtubize = (url) => {
  const HOSTNAME = 'www.googleapis.com';

  const PART_1 = '/youtube/v3/videos?id='
  const API_KEY_PARAMETER = '&key=';

  const API_KEYS = require('./apiKeys.js');
  const random_index = Math.floor(Math.random() * API_KEYS.length);
  const RANDOM_API = API_KEYS[random_index];

  const VIEWCOUNT_FIELDS = '&fields=items%28id%2Cstatistics%28viewCount%29%29';
  const VIEWCOUNT_PARTS = '&part=statistics';

  const yt_id = url.slice(-11);

  const path = PART_1 + yt_id + API_KEY_PARAMETER + RANDOM_API + VIEWCOUNT_FIELDS + VIEWCOUNT_PARTS;

  return [HOSTNAME, path];
};

// This promise always resolves so that sequential check can be possible.
const httpsMethods = require('./httpsMethods.js');

const getViews = (obj) => {
  const VIEWCOUNT_PATH = ['items', 'statistics', 'viewCount'];
  let views = obj?.[VIEWCOUNT_PATH[0]]?.[0]?.[VIEWCOUNT_PATH[1]]?.[VIEWCOUNT_PATH[2]];
  if (views) {
    return Number(views);
  } else {
    return 'No views available';
  }
};

const fetchSequentially = (set) => {
  const map = new Map();

  let p = Promise.resolve(undefined);
  for (let url of set) {
    let [hostname, path] = youtubize(url);
    p = p.then(() => httpsMethods.getRequest(hostname, path))
          .then((obj) => {
            let views = getViews(obj);
            console.log(`${url} | ${views}`);
            return views;
          })
          .then((value) => map.set(url, value));
  }

  return p;
};

const saveMapInFile = async (map, file) => {
  try {
    const ws = createWriteStream(file);
    map.forEach((value, key) => {
      ws.write(`${key}\t${value}\n`);
    });
    ws.end();
    console.log(`'${file}' file created: ${map.size} line(s) written.`)
  } catch (err) {
    console.error(err);
  }
}

processLineByLine(INPUT_FILE)
  .then(checkUrlFormat)
  .then(fetchSequentially)
  .then(map => saveMapInFile(map, VALID_URL_FILE))
  .then((value) => console.log(value));
