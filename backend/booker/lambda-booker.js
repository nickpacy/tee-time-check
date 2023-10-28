// const puppeteer = require('puppeteer');
// const { executablePath } = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const util = require('./utility');


// Load environment variables from .env file
dotenv.config();

async function initializeBrowser() {
    // const browser = await puppeteer.launch({
    //     args: ['--headless', '--disable-gpu', '--window-size=1280x1024', '--no-sandbox'],
    //     headless: true,
    // });
    // return browser;
    const browser = await puppeteer.launch({
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
    });
    return browser;
}

async function initializeDatabase() {
    // Create a connection pool for MySQL database
    
    const pool = mysql.createPool({
        connectionLimit: process.env.POOL_LIMIT, // Maximum number of connections in the pool
        host: process.env.DB_HOST, // MySQL database host
        user: process.env.DB_USER, // MySQL database user
        password: process.env.DB_PASSWORD, // MySQL database password
        database: process.env.DB_NAME, // MySQL database name
    });
    return pool
}

async function getUserLogin(userId) {
    let pool = await initializeDatabase();
    const connection = await pool.getConnection();

    let email = "";
    let password = "";

    try {
        query = "SELECT SettingKey, SettingValue FROM user_settings WHERE UserId = ? AND SettingKey LIKE '%TorreyPinesLogin%';";
        const [results] = await connection.execute(query, [userId]);
        for (const entry of results) {
            if (entry.SettingKey === 'TorreyPinesLoginEmail') {
                email = entry.SettingValue;
            } else if (entry.SettingKey === 'TorreyPinesLoginPassword') {
                password = util.decrypt(entry.SettingValue);
            }
        }
        connection.release();
        return [email, password]
    } catch (error) {
        console.log("An error occurred logging in the user: ", error)
        return [null, null];
    }
}

async function loginUser(page, email, password, link) {
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }), // wait until network is idle
        page.goto(link)
     ]);
    await page.waitForSelector('#login_email', { timeout: 1000 });
    await page.type('#login_email', email);
    await page.type('#login_password', password);
    await page.keyboard.press('Enter');
    await page.waitForSelector('#reservations-tab', { timeout: 10000 });
}

async function navigateToBookingPage(page, link, date) {
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }), // wait until network is idle
        page.goto(link)
     ]);
    // await page.click("//button[contains(text(), 'Resident (0 - 7 Days)')]");
    const [button] = await page.$x("//button[contains(text(), 'Resident (0 - 7 Days)')]");
    if (button) await button.click();
    await page.waitForSelector('#date-field', { timeout: 10000 });
    await setDateForTeeTime(page, date);
}

async function setDateForTeeTime(page, date) {
    await page.click('#date-field');
    await page.keyboard.down('End');
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Backspace');
    }
    await page.type('#date-field', date);
    await page.keyboard.press('Enter');
}


async function clickHighestButtonValue(page) {
    // Locate the parent div
    await page.waitForSelector('div[data-field="players"]', { timeout: 5000 }); // waits up to 5 seconds
    const parentDiv = await page.$('div[data-field="players"]');

    if (!parentDiv) {
        console.error('Parent div not found');
        return;
    }

    // Find all anchor child elements within the div
    const buttons = await parentDiv.$$('a');

    // Get data-value attributes of all buttons
    const buttonValues = await Promise.all(buttons.map(async (button) => {
        const valueStr = await page.evaluate(el => el.getAttribute('data-value'), button);
        return {
            element: button,
            value: parseInt(valueStr, 10)
        };
    }));

    // Sort the buttons based on their data-value in descending order
    buttonValues.sort((a, b) => b.value - a.value);

    // Click the button with the highest value
    await buttonValues[0].element.click();
}


async function selectTimeSlot(page, startTimeVariable) {
    await page.waitForSelector('#times-empty', { timeout: 10000 });
    
    let attempts = 0;
    const maxAttempts = 3;
    let foundTime = false;

    while (!foundTime && attempts < maxAttempts) {
        try {
            await page.waitForSelector('.booking-start-time-label', { timeout: 5000 }); // waits up to 5 seconds
            const times = await page.$$('.booking-start-time-label');
            let anyTimeAfterStartTime = false;

            for (let timeElement of times) {
                let displayedTime = await page.evaluate(el => el.innerText, timeElement);
                let displayedTimeInMinutes = await timeToMinutes(displayedTime);
                
                if (displayedTimeInMinutes === await timeToMinutes(startTimeVariable)) {
                    await timeElement.click();
                    foundTime = true;
                }
        
                if (displayedTimeInMinutes >= await timeToMinutes(startTimeVariable)) {
                    anyTimeAfterStartTime = true;
                }
            }

            if (foundTime) {
                console.log("Found");
                await clickHighestButtonValue(page);

                // Try to click the book time button
                let bookTimeButton = await page.$('button.btn.btn-success.js-book-button.pull-left');
                if (bookTimeButton) {
                    console.log("SIMULATE BOOKING");
                    // await bookTimeButton.click();
                }

                // Check if the recaptcha-token appears
                // await checkRecaptcha(page);
                return;
            }

            if (!anyTimeAfterStartTime) {
                console.log("No Times Found");
                return;
            }

            const isTimesEmptyPresent = !!(await page.$('#times-empty'));
            if (isTimesEmptyPresent) break;

        } catch (error) {
            if (error.message.includes('Node is either not visible or not an HTMLElement')) {
                attempts++;
                console.log('Stale element detected. Retrying...');
            } else {
                throw error;
            }
        }
    }
}


// async function checkRecaptcha(page) {
//     try {
//         // Wait for the iframe whose title contains the word "recaptcha challenge expires"
//         await page.waitForSelector('iframe[title*="recaptcha challenge expires"]', { timeout: 10000 });
        
//         // Get all iframes with that title
//         const iframesWithRecaptchaTitle = await page.$$('iframe[title*="recaptcha challenge expires"]');

//         if (iframesWithRecaptchaTitle.length === 0) {
//             console.log("No iframe with recaptcha title detected. Tee Time should be booked");
//             return;
//         } else {
//             // Switch to the first iframe with a title containing "recaptcha"
//             const frameElement = iframesWithRecaptchaTitle[0];
//             const frame = await frameElement.contentFrame();

//             // Now check for the recaptcha-token inside the iframe
//             let isRecaptchaPresent = false;
//             try {
//                 await frame.waitForSelector('#recaptcha-token', { timeout: 5000 });
//                 isRecaptchaPresent = true;
//             } catch (error) {
//                 console.log("Recaptcha token not found.");
//             }

//             if (isRecaptchaPresent) {
//                 console.log("Recaptcha token detected. Exiting. Should notify user to go book manually");
//                 return;
//             }
//         }
//     } catch (error) {
//         console.log("Waiting for iframe timed out. No iframe with recaptcha title detected.");
//         return;
//     }
// }


function timeToMinutes(time) {
    let [hours, minutes] = time.split(':');
    let period = time.includes('pm') && hours !== '12' ? 'pm' : 'am';
    let cleanMinutes = minutes.replace(/[ap]m/, '');
    if (period === 'pm') hours = parseInt(hours) + 12;
    return parseInt(hours) * 60 + parseInt(cleanMinutes);
}

const loginToBooker = async (teeTimeData) => {

    console.log("FROM LOGIN BOOKER", teeTimeData);

    const [email, password] = await getUserLogin(teeTimeData.userId);

    // Check if username or password is blank or undefined
    if (!email || !password) {
        console.error("No credentials available.");
        process.exit(0);
    }

    let browser = await initializeBrowser();
    let page = await browser.newPage();
    await page.setViewport({width: 1440,height: 1024});
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537');


    try {
        await loginUser(page, email, password, teeTimeData.bookingLink);
        await navigateToBookingPage(page, teeTimeData.bookingLink, teeTimeData.date);
        await selectTimeSlot(page, teeTimeData.time);
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        console.log("Function Completed");
        // setTimeout(() =>  {
        //     browser.close().then(() => {
        //         process.exit(0);
        //     });
        // }, 300000);
        await browser.close();
        process.exit(0);
    }
};

module.exports = {
    loginToBooker
};