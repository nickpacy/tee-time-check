const playwrightAWS = require('playwright-aws-lambda');
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const util = require('./utility');

// Load environment variables from .env file
dotenv.config();

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function initializeBrowser() {
    const headlessMode = process.env.HEADLESS_MODE === 'true';
    try {
        console.log('Launching browser with headless mode:', headlessMode);
        const browser = await playwrightAWS.launchChromium({
            args: [
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
                  "--disk-cache-size=33554432",
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
                  "--single-process",
            ],
            headless: headlessMode
        });
        console.log('Browser launched successfully');
        return browser;
    } catch (error) {
        console.error('Playwright error:', error);
        throw error;
    }
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
        const query = "SELECT SettingKey, SettingValue FROM user_settings WHERE UserId = ? AND SettingKey LIKE '%TorreyPinesLogin%';";
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
    
    // Navigate to the page and wait until network is idle
    try {
        await page.goto(link, { waitUntil: 'networkidle', timeout: 120000 });
    } catch (navigationError) {
        console.error('Navigation error:', navigationError);
        throw navigationError;
    }

    // Wait for the email input field to be available
    await page.waitForSelector('#login_email', { timeout: 1000 });
    await page.type('#login_email', email);

    // Type the password
    await page.type('#login_password', password);

    // Press Enter to submit the form
    await page.keyboard.press('Enter');

    // Wait for the reservations tab to be available
    await page.waitForSelector('#reservations-tab', { timeout: 10000 });
}


async function navigateToBookingPage(page, link, date) {
    // Navigate to the page and wait until network is idle
    await page.goto(link, { waitUntil: 'networkidle' });

    // Playwright uses a unified selector engine for both CSS and XPath
    const button = await page.$('xpath=//button[contains(text(), "Resident (0 - 7 Days)")]');
    if (button) {
        await button.click();
    }

    // Wait for the date field to be available
    await page.waitForSelector('#date-field', { timeout: 10000 });

    // Call a function to set the date for the tee time
    await setDateForTeeTime(page, date);
}



async function setDateForTeeTime(page, date) {
    // Ensure the date is a valid string
    if (typeof date !== 'string') {
        console.error('Invalid date: expected a string, but got:', date);
        throw new TypeError('setDateForTeeTime expects date to be a string');
    }
    
    // Click the date input field to focus on it
    await page.click('#date-field');

    // Press 'End' to move the cursor to the end of the input field
    await page.keyboard.press('End');

    // Clear the input by pressing 'Backspace' 10 times
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Backspace');
    }

    // Type the new date into the input field
    await page.type('#date-field', date);

    // Press 'Enter' to submit the date
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
    if (buttonValues.length > 0) {
        await buttonValues[0].element.click();
    } else {
        console.error('No buttons found to click.');
    }
}



async function selectTimeSlot(page, startTimeVariable) {
    await page.waitForSelector('#times-empty', { timeout: 10000 });
    
    let attempts = 0;
    const maxAttempts = 3;
    let foundTime = false;

    while (!foundTime && attempts < maxAttempts) {
        try {
            await page.waitForSelector('.booking-start-time-label', { timeout: 3000 }); // waits up to 3 seconds
            const times = await page.$$('.booking-start-time-label');
            let anyTimeAfterStartTime = false;
            var displayedTime

            for (let timeElement of times) {
                displayedTime = await page.evaluate(el => el.innerText, timeElement);
                let displayedTimeInMinutes = await timeToMinutes(displayedTime);
                
                if (displayedTimeInMinutes === await timeToMinutes(startTimeVariable)) {
                    await timeElement.click();
                    foundTime = true;
                    break; // Once the correct time is found and clicked, break out of the loop
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

                    await delay(5000);
                    console.log("SIMULATE BOOKING", displayedTime);
                    // Uncomment the next line in production to perform the click
                    // await bookTimeButton.click();
                }

                // Optionally check for recaptcha or other forms of CAPTCHA
                // await checkRecaptcha(page);
                return;
            }

            if (!anyTimeAfterStartTime) {
                console.log("No Times Found");
                return;
            }

            // Check if the times are empty and if so, break the loop
            const isTimesEmptyPresent = !!(await page.$('#times-empty'));
            if (isTimesEmptyPresent) break;

        } catch (error) {
            if (error.message.includes('Node is either not visible or not an HTMLElement')) {
                console.log('Stale element detected. Retrying...');
            } else {
                // Propagate other types of errors
                throw error;
            }
        }
        attempts++;
    }

    if (!foundTime) {
        console.log("Failed to find a time slot after " + maxAttempts + " attempts.");
    }

}

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

    // let browser = await initializeBrowser();
    const browser = await initializeBrowser();
    console.log('Creating new browser context');
    const context = await browser.newContext();
    console.log('Creating new page');
    await delay(5000);
    const page = await context.newPage();
    console.log('New page created successfully');
    //await page.setViewportSize({width: 1156,height: 861});

    try {
        console.log("Attempting to login...");
        await delay(5000);
        await loginUser(page, email, password, teeTimeData.bookingLink);
        console.log("Attempting to navigate...");
        await navigateToBookingPage(page, teeTimeData.bookingLink, teeTimeData.date);
        console.log("Attempting to select time...");
        await selectTimeSlot(page, teeTimeData.time);
        console.log("Everything has completed");
    } catch (error) {
        console.error("An error occurred:", error);
        if (browser) {
            await browser.close();
        }
        throw error;
    } finally {
        console.log("Cleaning up resources...");
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = {
    loginToBooker
};