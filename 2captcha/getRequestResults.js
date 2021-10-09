const poll = require("promise-poller").default;
const request = require("request-promise-native");

function requestCaptchaResults(apiKey, requestId) {
  const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
  return async function () {
    return new Promise(async function (resolve, reject) {
      const rawResponse = await request.get(url);
      const resp = JSON.parse(rawResponse);
      console.log(resp.request); // this consoles out 'CAPTCHA_NOT_READY' until it is ready
      if (resp.status === 0) return reject(resp.request);
      resolve(resp.request);
    });
  };
}

const timeout = (millis) => new Promise((resolve) => setTimeout(resolve, millis));

async function requestResults(key, id, retries = 100, interval = 5000, delay = 30000) {
  try {
    await timeout(delay);
    return poll({
      taskFn: requestCaptchaResults(key, id),
      interval,
      retries,
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = requestResults;
