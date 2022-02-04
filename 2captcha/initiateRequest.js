const axios = require("axios");

async function initiateRequest(captchaApiKey) {
  while (true) {
    try {
      const formData = {
        key: captchaApiKey,
        method: "userrecaptcha",
        googlekey: "6Lf9Tz8aAAAAAF2SwORDM_AaaUTPyP885ri8xP70",
        pageurl:
          "https://registrovacunacovid.mspas.gob.gt/mspas/citas/consulta",
        json: 1,
      };

      const response = await axios.get("http://2captcha.com/in.php", {
        params: formData,
      });

      return response.data.request;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = initiateRequest;
