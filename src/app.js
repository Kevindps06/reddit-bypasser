const util = require("util");
const fs = require("fs");
const xl = require("excel4node");
const wb = new xl.Workbook();
const ws = wb.addWorksheet("Result");
const path = require("path");

const initiateRequest = require("../2captcha/initiateRequest");
const getRequestResults = require("../2captcha/getRequestResults");

const interface = require("./api/interface");
const input = require("../input.json");
const result = fs.existsSync("result.json") ? require("../result.json") : [];
const apiKey = require("../2captcha/apiKey");

(async () => {
  let startingLength = input.length;

  while (input.length > 0) {
    if (input.length > startingLength || input.length < startingLength) {
      startingLength = input.length
    }

    while (true) {
      try {
        console.log("Initiating interface...");
        await interface.init();
        console.log("Interface initialization finish.");

        console.log("Loading page...");
        await interface.visitPage(
          "https://registrovacunacovid.mspas.gob.gt/mspas/citas/consulta"
        );
        console.log("Page loading finished.");

        console.log("Inputing data...");
        await interface.querySelectorInputAndType(
          "input[placeholder='CUI (DPI) / Pasaporte']",
          input[0].DPI
        );

        await interface.querySelectorInputAndType(
          "input[name=mydate]",
          input[0]["Fecha de Nacimiento"]
        );
        console.log("Data input finished.");

        console.log("Solving captcha...");
        const response = await getRequestResults(
          apiKey,
          await initiateRequest(apiKey)
        );

        await interface.evaluatePage(
          `document.getElementsByName('g-recaptcha-response')[0].innerHTML="${response}";`
        );

        await interface.evaluatePage(
          `___grecaptcha_cfg.clients[0].o.o.callback("${response}");`
        );
        console.log("Captcha solved.");

        await interface.querySelectorButtonAndClick("button[type=submit]");

        console.log("Waiting web response...");
        let waitingWebResponseSeconds = 0;
        do {
          await util.promisify(setTimeout)(1000);
          waitingWebResponseSeconds++;

          if (waitingWebResponseSeconds >= 30) {
            throw "TimeoutError: Waiting web response timeout 30000 ms exceeded";
          }
        } while (
          (await interface.querySelectorFound("div.swal2-popup")) &&
          (await interface.querySelectorAttribute(
            "div.swal2-popup",
            "innerText"
          )) === "OK"
        );

        await util.promisify(setTimeout)(1000);

        if (await interface.querySelectorFound("div.swal2-popup")) {
          console.log("Web response error.");

          result.push({
            Empresa: input[0].Empresa,
            DPI: input[0].DPI,
            "Fecha de Nacimiento": input[0]["Fecha de Nacimiento"],
            Nombre: "No encontrado",
            Telefono: "No encontrado",
          });

          console.log("Generating result files...");
          fs.writeFileSync(path.join("result.json"), JSON.stringify(result));

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
          wb.write("result.xlsx");
          console.log("Result files generated.");

          await interface.close();

          input.splice(0, 1);
          fs.writeFileSync(
            path.join(__dirname, "input.json"),
            JSON.stringify(input)
          );

          console.log(
            `Progress ${startingLength - input.length}/${startingLength}`
          );
          break;
        }
        console.log("Web response successful.");

        console.log("Waiting data response...");
        do {
          await util.promisify(setTimeout)(1000);
        } while (interface.response === null);
        console.log("Data response getted.");

        result.push({
          Empresa: input[0].Empresa,
          DPI: input[0].DPI,
          "Fecha de Nacimiento": input[0]["Fecha de Nacimiento"],
          Nombre: interface.response.individual.nombre_completo,
          Telefono: `${interface.response.individual.telefono}`,
        });

        console.log("Generating result files...");
        fs.writeFileSync(
          path.join(__dirname, "result.json"),
          JSON.stringify(result)
        );

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
        wb.write("result.xlsx");
        console.log("Result files generated.");

        await interface.close();

        input.splice(0, 1);
        fs.writeFileSync(
          path.join(__dirname, "input.json"),
          JSON.stringify(input)
        );

        console.log(
          `Progress ${startingLength - input.length}/${startingLength}`
        );
        break;
      } catch (err) {
        console.log(`Process error, retrying... ${err}`);
        await interface.close();
        continue;
      }
    }
  }
})();
