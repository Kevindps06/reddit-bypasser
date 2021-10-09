const util = require("util");

const initiateRequest = require("./2captcha/initiateRequest");
const getRequestResults = require("./2captcha/getRequestResults");

const interface = require("./scrawly/api/interface");
const credentials = require("./credentials");
const apiKey = require("./2captcha/apiKey");

(async () => {
  for (credential of credentials) {
    await interface.init();
    await interface.visitPage(
      "https://registrovacunacovid.mspas.gob.gt/mspas/citas/consulta"
    );
    await interface.querySelectorInputAndType(
      "input[placeholder='CUI (DPI) / Pasaporte']",
      credential.document
    );
    await interface.querySelectorInputAndType(
      "input[name=mydate]",
      credential.time
    );
    const requestId = await initiateRequest(apiKey);
    console.log(requestId);
    const response = await getRequestResults(apiKey, requestId);
    await interface.evaluatePage(
      `document.getElementsByName('g-recaptcha-response')[0].innerHTML="${response}";`
    );
    await interface.evaluatePage(
      `___grecaptcha_cfg.clients[0].l.l.callback("${response}");`
    );
    await interface.querySelectorButtonAndClick("button[type=submit]");
    await util.promisify(setTimeout)('2000')
    await interface.close();
  }
})();
