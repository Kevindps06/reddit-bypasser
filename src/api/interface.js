const puppeteer = require("puppeteer");

const interface = {
  browser: null,
  page: null,
  response: null,
  async init() {
    const minimal_args = [
      "--autoplay-policy=user-gesture-required",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-client-side-phishing-detection",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      "--disable-domain-reliability",
      "--disable-extensions",
      "--disable-features=AudioServiceOutOfProcess",
      "--disable-hang-monitor",
      "--disable-ipc-flooding-protection",
      "--disable-notifications",
      "--disable-offer-store-unmasked-wallet-cards",
      "--disable-popup-blocking",
      "--disable-print-preview",
      "--disable-prompt-on-repost",
      "--disable-renderer-backgrounding",
      "--disable-setuid-sandbox",
      "--disable-speech-api",
      "--disable-sync",
      "--hide-scrollbars",
      "--ignore-gpu-blacklist",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      "--no-pings",
      "--no-sandbox",
      "--no-zygote",
      "--password-store=basic",
      "--use-gl=swiftshader",
      "--use-mock-keychain",
      /*"--no-startup-window",*/
    ];

    try {
      this.browser = await puppeteer.launch({
        args: minimal_args,
        headless: false,
        slowMo: 50,
        userDataDir: "../.cache",
      });
      this.page = await this.browser.newPage();

      this.page.on("response", async (response) => {
        if (
          response.url() ===
            "https://registrovacunacovid.mspas.gob.gt:2096/vacunacion/api/L3ZhY3VuYWRv" &&
          response.status() === 200
        ) {
          this.response = JSON.parse(await response.text());
        }
      });

      await this.page.setViewport({ width: 1280, height: 720 });

      await this.page.setDefaultNavigationTimeout(60000);
    } catch (err) {
      console.log(err);
    }
  },
  async visitPage(url) {
    await this.page.goto(url);
  },
  async close() {
    await this.browser.close();
  },
  /**
   * Runs querySelectorAll on whatever selector is passed in.
   * Then maps over returned values, finds the attribute that was passed in and returns those values as an array.
   * @param {string} selector
   * @param {string} attribute
   * @returns {Array[]}
   */
  async querySelectorAllAttributes(selector, attribute) {
    try {
      return await this.page.$$eval(
        selector,
        (elements, attribute) => {
          return elements.map((element) => element[attribute]);
        },
        attribute
      );
    } catch (error) {
      console.log(error);
    }
  },
  /**
   * Runs querySelector on whatever selector is passed in.
   * Then maps over returned value, finds the attribute that was passed in and returns that value.
   * @param {string} selector
   * @param {string} attribute
   * @returns {Array[]}
   */
  async querySelectorAttribute(selector, attribute) {
    try {
      return await this.page.$eval(
        selector,
        (element, attribute) => {
          return element[attribute];
        },
        attribute
      );
    } catch (error) {
      console.log(error);
    }
  },
  async querySelectorFound(selector) {
    try {
      return (await this.page.$(selector)) !== null;
    } catch (error) {
      console.log(error);
    }
  },
  /**
   * Runs querySelector on whatever selector is passed in.
   * Selector should be an input field
   * Then pass value into input field
   * @param {string} selector
   * @param {string} input
   * @return void
   */
  async querySelectorInputAndType(selector, input) {
    try {
      return await this.page.type(selector, input);
    } catch (error) {
      console.log(error);
    }
  },
  /**
   * Runs querySelector on whatever selector is passed in.
   * Selector should be an button
   * Clicks button
   * @param {string} selector
   * @return void
   */
  async querySelectorButtonAndClick(selector) {
    try {
      return await this.page.click(selector);
    } catch (error) {
      console.log(error);
    }
  },
  /**
   * Simple wrapper for Puppeteer evaluate function
   * Visit https://pptr.dev/#?product=Puppeteer&version=v10.1.0&show=api-pageevaluatepagefunction-args for more info
   * @param {string} data
   * @return void
   */
  async evaluatePage(data) {
    try {
      return await this.page.evaluate(data);
    } catch (error) {
      console.log(error);
    }
  },
  pageRequests(requestURL = "") {
    return requests;
  },
};

module.exports = interface;
