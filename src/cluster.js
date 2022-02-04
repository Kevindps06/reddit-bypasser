const { Cluster } = require("puppeteer-cluster");
const util = require("util");
const fs = require("fs");
const xl = require("excel4node");
const wb = new xl.Workbook();
const ws = wb.addWorksheet("Result");

const initiateRequest = require("../2captcha/initiateRequest");
const getRequestResults = require("../2captcha/getRequestResults");

const input = require("../input.json");
const result = fs.existsSync("../result.json") ? require("../result.json") : [];
const apiKey = require("../2captcha/apiKey");

const args = [];

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 5,
    timeout: 2147483647,
    puppeteerOptions: {
      args: args,
      headless: false,
      defaultViewport: false,
      userDataDir: "../.cache",
    },
  });

  cluster.on("taskerror", (err, data) => {
    console.log(`Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data }) => {
    let response;

    page.on("response", async (res) => {
      if (
        res.url() ===
          "https://registrovacunacovid.mspas.gob.gt:2096/vacunacion/api/L3ZhY3VuYWRv" &&
        res.status() === 200
      ) {
        response = JSON.parse(await res.text());
      }
    });

    while (true) {
      try {
        console.log("Loading page...");
        await page.goto(data.url);
        console.log("Page loading finished.");

        console.log("Inputing data...");
        await page.type(
          "input[placeholder='CUI (DPI) / Pasaporte']",
          data.input.DPI
        );

        await page.type(
          "input[name=mydate]",
          data.input["Fecha de Nacimiento"]
        );
        console.log("Data input finished.");

        console.log("Solving captcha...");
        const captchaResponse = await getRequestResults(
          apiKey,
          await initiateRequest(apiKey)
        );

        await page.evaluate(
          `document.getElementsByName('g-recaptcha-response')[0].innerHTML="${captchaResponse}";`
        );

        await page.evaluate(
          `___grecaptcha_cfg.clients[0].o.o.callback("${captchaResponse}");`
        );
        console.log("Captcha solved.");

        await page.click("button[type=submit]");

        console.log("Waiting web response...");
        let waitingWebResponseSeconds = 0;
        do {
          await util.promisify(setTimeout)(1000);
          waitingWebResponseSeconds++;

          if (waitingWebResponseSeconds >= 30) {
            throw "TimeoutError: Waiting web response timeout 30000 ms exceeded";
          }
        } while (
          (await page.$("div.swal2-popup")) !== null &&
          (await page.$eval(
            "div.swal2-popup",
            (element, attribute) => {
              return element[attribute];
            },
            "innerText"
          )) === "OK"
        );

        await util.promisify(setTimeout)(1000);

        if ((await page.$("div.swal2-popup")) !== null) {
          console.log("Web response error.");

          console.log("Generating result files...");
          pushIntoResult(data.input, "No encontrado", "No encontrado");
          console.log("Result files generated.");

          break;
        }

        console.log("Web response successful.");

        console.log("Getting data response...");
        do {
          await util.promisify(setTimeout)(1000);
        } while (!response);
        console.log("Data response getted.");

        console.log("Generating result files...");
        pushIntoResult(
          data.input,
          response.individual.nombre_completo,
          response.individual.telefono
        );
        console.log("Result files generated.");

        break;
      } catch (err) {
        console.log(`Process error, retrying... ${err}`);
      }
    }
  });

  for (let i = 0; input.length > i; i++) {
    await cluster.queue({
      url: "https://registrovacunacovid.mspas.gob.gt/mspas/citas/consulta",
      input: input[i],
    });
  }

  await cluster.idle();
  await cluster.close();
})();

function pushIntoResult(data, nombre, telefono) {
  result.push({
    Empresa: data.Empresa,
    DPI: data.DPI,
    "Fecha de Nacimiento": data["Fecha de Nacimiento"],
    Nombre: nombre,
    Telefono: telefono,
  });

  fs.writeFileSync("../result.json", JSON.stringify(result));

  const headingColumnNames = [
    "Empresa",
    "DPI",
    "Fecha de Nacimiento",
    "Nombre",
    "Telefono",
  ];

  //Write Column Title in Excel file
  let headingColumnIndex = 1;
  headingColumnNames.forEach((heading) => {
    ws.cell(1, headingColumnIndex++).string(heading);
  });

  //Write Data in Excel file
  let rowIndex = 2;
  result.forEach((record) => {
    let columnIndex = 1;
    Object.keys(record).forEach((columnName) => {
      ws.cell(rowIndex, columnIndex++).string(record[columnName]);
    });
    rowIndex++;
  });
  wb.write("../result.xlsx");

  /*input.splice(0, 1);
  fs.writeFileSync("../input.json", JSON.stringify(input));*/
}
