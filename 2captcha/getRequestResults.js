const poll = require("promise-poller").default;
const axios = require("axios");

function requestCaptchaResults(apiKey, requestId) {
  const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
  return async function () {
    return new Promise(async function (resolve, reject) {
      while (true) {
        try {
          const rawResponse = await axios.get(url);
          const resp = rawResponse.data;
          //console.log(resp.request); // this consoles out 'CAPTCHA_NOT_READY' until it is ready
          if (resp.status === 0) {
            return reject(resp.request);
          }
          
          return resolve(resp.request);
        } catch (err) {
          console.log(err);
        }
      }
    });
  };
}

const timeout = (millis) =>
  new Promise((resolve) => setTimeout(resolve, millis));

async function requestResults(
  key,
  id,
  retries = 50,
  interval = 5000,
  delay = 30000
) {
  await timeout(delay);

  return poll({
    taskFn: requestCaptchaResults(key, id),
    interval,
    retries,
  });
}

module.exports = requestResults;
