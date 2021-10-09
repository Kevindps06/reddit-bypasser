const request = require("request-promise-native");

async function initiateRequest(captchaApiKey) {
  const formData = {
    key: captchaApiKey,
    method: "userrecaptcha",
    googlekey: "6Lf9Tz8aAAAAAF2SwORDM_AaaUTPyP885ri8xP70",
    pageUrl: "https://registrovacunacovid.mspas.gob.gt/mspas/citas/consulta",
    json: 1,
  };
  try {
    const response = await request.post("http://2captcha.com/in.php", { form: formData });
    return JSON.parse(response).request;
  } catch (error) {
    console.log(error);
  }
}

module.exports = initiateRequest;
