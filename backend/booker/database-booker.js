const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const util = require('./utility');

// Load environment variables from .env file
dotenv.config();

async function initializeDriver() {
    // let driver = await new Builder().forBrowser('chrome').build();
    let chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless', '--disable-gpu', '--window-size=1280x1024', '--no-sandbox');
    chromeOptions.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    let driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
    return driver;
}

async function initializeDatabase() {
    // Create a connection pool for MySQL database
    let pool;
    if (!pool) {
        pool = mysql.createPool({
            connectionLimit: process.env.POOL_LIMIT, // Maximum number of connections in the pool
            host: process.env.DB_HOST, // MySQL database host
            user: process.env.DB_USER, // MySQL database user
            password: process.env.DB_PASSWORD, // MySQL database password
            database: process.env.DB_NAME, // MySQL database name
        });
    }
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
        
        // Map the results
        for (const entry of results) {
            if (entry.SettingKey === 'TorreyPinesLoginEmail') {
                email = entry.SettingValue;
            } else if (entry.SettingKey === 'TorreyPinesLoginPassword') {
                password = util.decrypt(entry.SettingValue);
            }
        }

        console.log('Email:', email);
        console.log('Password:', password);

        return [email, password]
    } catch (error) {
        console.log("An error occurred", error)
    }
}

async function loginUser(driver, email, password, link) {
    await driver.get(link);
    await driver.findElement(By.id('login_email')).sendKeys(email);
    await driver.findElement(By.id('login_password')).sendKeys(password, Key.RETURN);
    await driver.wait(until.elementLocated(By.id('reservations-tab')), 10000);
}

async function navigateToBookingPage(driver, link, date) {
    await driver.get(link);
    await driver.findElement(By.xpath("//button[contains(text(), 'Resident (0 - 7 Days)')]")).click();
    await driver.wait(until.elementLocated(By.id('date-field')), 10000);
    await setDateForTeeTime(driver, date);
}

async function setDateForTeeTime(driver, date) {

    // Find the input element and input the formatted date
    let dateField = await driver.findElement(By.xpath("//input[@id='date-field']"));
    await dateField.click();

    // Move cursor to the end of the input field
    await dateField.sendKeys(Key.END);

    // Send several backspaces to clear the field (assuming the maximum length is 10 characters)
    for (let i = 0; i < 10; i++) {
        await dateField.sendKeys(Key.BACK_SPACE);
    }

    // Now send the new date
    await dateField.sendKeys(date, Key.ENTER);
}

async function isTeeTimeUnavailable(driver) {
    const bookTimePromise = driver.wait(until.elementLocated(By.id('book_time')), 10000);
    const errorPopupPromise = driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'bootstrap-growl alert alert-danger') and contains(text(), 'Sorry, that tee time is no longer available.')]")), 10000);

    const result = await Promise.race([bookTimePromise, errorPopupPromise])
        .then(async (element) => {
            let elementId = await element.getAttribute('id');
            if (elementId === 'book_time') {
                return false;  // Tee time is available
            } else {
                return true;  // Error message is shown
            }
        })
        .catch((err) => {
            // Handle any error that might arise, e.g., neither condition is met within the timeout
            console.error(err);
            return true;  // Default to assuming the tee time is unavailable
        });

    return result;
}

async function clickHighestButtonValue(driver) {
    // Locate the parent div
    let parentDiv = await driver.findElement(By.css('div[data-field="players"]'));

    // Find all anchor child elements within the div
    let buttons = await parentDiv.findElements(By.tagName('a'));

    // Get data-value attributes of all buttons
    let buttonValues = await Promise.all(buttons.map(async (button) => {
        return {
            element: button,
            value: parseInt(await button.getAttribute('data-value'))
        };
    }));

    // Sort the buttons based on their data-value in descending order
    buttonValues.sort((a, b) => b.value - a.value);

    // Click the button with the highest value
    await buttonValues[0].element.click();
}

async function selectTimeSlot(driver, startTimeVariable) {
    await driver.wait(until.elementLocated(By.id('times-empty')), 10000);
    let timesEmptyElement = await driver.findElement(By.id('times-empty'));
    await driver.wait(until.stalenessOf(timesEmptyElement), 10000);

    let foundTime = false;
    let maxAttempts = 3;
    let attempts = 0;

    while (!foundTime && attempts < maxAttempts) {
        try {
            let times = await driver.findElements(By.css('.booking-start-time-label'));
            let anyTimeAfterStartTime = false; 

            for (let time of times) {
                let displayedTime = await time.getText();
                let displayedTimeInMinutes = timeToMinutes(displayedTime);
                
                if (displayedTimeInMinutes == timeToMinutes(startTimeVariable)) {
                    await time.click();

                    if(await isTeeTimeUnavailable(driver)) {
                        console.log("Tee time at " + displayedTime + " is unavailable.");
                        continue; 
                    } else if(await driver.findElements(By.id('book_time')).then(elements => elements.length > 0)) {
                        // Tee time is available and booking is proceeding
                        foundTime = true;
                        break;
                    }
                }
        
                if (displayedTimeInMinutes == timeToMinutes(startTimeVariable)) {
                    anyTimeAfterStartTime = true;
                }
            }

            if (foundTime) {
                // BOOK THE TEE TIME
                console.log("Found");
                await clickHighestButtonValue(driver);

                // Click the book time button
                let bookTimeButton = await driver.findElement(By.css('button.btn.btn-success.js-book-button.pull-left'));
                // await bookTimeButton.click();

                // Check if the recaptcha-token appears
                await checkRecaptcha(driver);

                return;
            }

            if (!anyTimeAfterStartTime) {
                console.log("No Times Found");
                return;
            }

            let isTimesEmptyPresent = await driver.findElements(By.id('times-empty')).then(elements => elements.length > 0);
            if (isTimesEmptyPresent) break;

        } catch (error) {
            if (error.name === 'StaleElementReferenceError') {
                attempts++;
                console.log('Stale element detected. Retrying...');
            } else {
                throw error;
            }
        }
    }
}


async function checkRecaptcha(driver) {
    // Locate the iframe whose title contains the word "recaptcha"
    try {
        let iframeElement = await driver.wait(until.elementLocated(By.css('iframe[title*="recaptcha challenge expires"]')), 10000);
        await driver.wait(until.elementIsVisible(iframeElement), 10000);

        console.log(iframesWithRecaptchaTitle);

        if (iframesWithRecaptchaTitle.length === 0) {
            console.log("No iframe with recaptcha title detected. Tee Time SHould be booked");
            return;
        } else {
            // Switch to the first iframe with a title containing "recaptcha"
            await driver.switchTo().frame(iframesWithRecaptchaTitle[0]);

            // Now check for the recaptcha-token inside the iframe
            let isRecaptchaPresent = false;
            try {
                await driver.wait(until.elementLocated(By.id('recaptcha-token')), 5000);
                isRecaptchaPresent = true;
            } catch (error) {
                console.log("Recaptcha token not found.");
            }

            // Switch back to main content
            await driver.switchTo().defaultContent();

            if (isRecaptchaPresent) {
                console.log("Recaptcha token detected. Exiting. Should notify user to go book manually");
                return;
            }
        }
    } catch (error) {
        console.log("Waiting for iframe timed out. No iframe with recaptcha title detected.");
        return;
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

    let userlogin = await getUserLogin(teeTimeData.userId);
    // Check if username or password is blank or undefined
    if (!userlogin[0] || !userlogin[1]) {
        console.error("No credentials available.");
        driver.quit();
        process.exit(0);
    }

    let driver = await initializeDriver();
    
    try {
        await loginUser(driver, userlogin[0], userlogin[1], teeTimeData.bookingLink);
        await navigateToBookingPage(driver, teeTimeData.bookingLink, teeTimeData.date);
        await selectTimeSlot(driver, teeTimeData.time);
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        console.log("Function Completed");
        // setTimeout(() => driver.quit(), 300000); //Quit after 5 minutes
        await driver.quit()
        process.exit(0);
    }
};

module.exports = {
    loginToBooker
};