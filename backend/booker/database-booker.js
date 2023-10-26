const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const SunCalc = require('suncalc');
const util = require('./utility');

// Load environment variables from .env file
dotenv.config();

async function initializeDriver() {
    let driver = await new Builder().forBrowser('chrome').build();
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
    console.log("pool", pool)
    return pool
}

async function getUserPreferences() {
    let pool = await initializeDatabase();
    const connection = await pool.getConnection();

    try {
        query = "SELECT '5:00am' AS StartTime, '2023-10-20' AS StartDate LIMIT 1;";
        const [results] = await connection.execute(query);
        console.log(results);
    } catch (error) {
        console.log("An error occurred", error)
    }
}

async function getUserLogin() {
    let pool = await initializeDatabase();
    const connection = await pool.getConnection();

    let email = "";
    let password = "";

    try {
        query = "SELECT SettingKey, SettingValue FROM user_settings WHERE UserId = 1 AND SettingKey LIKE '%TorreyPinesLogin%';";
        const [results] = await connection.execute(query);
        
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

async function loginUser(driver, email, password) {
    await driver.get('https://foreupsoftware.com/index.php/booking/19347/1467#/login');
    await driver.findElement(By.id('login_email')).sendKeys(email);
    await driver.findElement(By.id('login_password')).sendKeys(password, Key.RETURN);
    await driver.wait(until.elementLocated(By.id('reservations-tab')), 10000);
}

async function navigateToBookingPage(driver) {
    await driver.get('https://foreupsoftware.com/index.php/booking/19347/1467#/teetimes');
    await driver.findElement(By.xpath("//button[contains(text(), 'Resident (0 - 7 Days)')]")).click();
    await driver.wait(until.elementLocated(By.id('date-field')), 10000);

    const delay = getMillisecondsUntil7PM();
    await new Promise(resolve => setTimeout(resolve, delay));

    // await driver.findElement(By.xpath("(//td[contains(@class, 'day') and not(contains(@class, 'disabled'))])[last()-1]")).click();

    await inputOneWeekFromNowInPDT(driver);
}

async function inputOneWeekFromNowInPDT(driver) {
    // Get the current date
    const currentDate = new Date();
    
    // Add one week (7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
    currentDate.setTime(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Format the date in PDT
    const dateInPDT = currentDate.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
    const [month, day, year] = dateInPDT.split('/');

    const formattedDate = `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${year}`;
    console.log("formatted date", formattedDate);

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
    await dateField.sendKeys(formattedDate, Key.ENTER);
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

async function selectTimeSlot(driver, startTimeVariable, lastTimeInMinutes) {
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
                
                if (displayedTimeInMinutes >= timeToMinutes(startTimeVariable) && displayedTimeInMinutes <= lastTimeInMinutes) {
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
        
                if (displayedTimeInMinutes > timeToMinutes(startTimeVariable) && displayedTimeInMinutes <= lastTimeInMinutes) {
                    anyTimeAfterStartTime = true;
                }
            }

            if (foundTime) {
                // BOOK THE TEE TIME
                console.log("Found");
                await clickHighestButtonValue(driver);
                // let bookTimeButton = await driver.findElement(By.css('button.btn.btn-success.js-book-button.pull-left'));
                // await bookTimeButton.click();
                break;
            }

            if (!anyTimeAfterStartTime) {
                console.log("No Times");
                break;
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


function timeToMinutes(time) {
    let [hours, minutes] = time.split(':');
    let period = time.includes('pm') && hours !== '12' ? 'pm' : 'am';
    let cleanMinutes = minutes.replace(/[ap]m/, '');
    if (period === 'pm') hours = parseInt(hours) + 12;
    return parseInt(hours) * 60 + parseInt(cleanMinutes);
}

function getMillisecondsUntil7PM() {
    const now = new Date();
    const targetTime = new Date(now);

    // Set to 3am UTC which is 7pm PST
    targetTime.setUTCHours(2, 0, 0, 0); 
    
    // If it's already past 3am UTC (i.e., past 7pm PST), target the next day's 3am UTC.
    if (now > targetTime) {
        targetTime.setUTCDate(targetTime.getUTCDate() + 1);
    }

    console.log(now);
    console.log(targetTime);

    const delay = targetTime - now;
    console.log(`Waiting until 7 PM. The delay is ${delay} milliseconds.`);
    // If the delay is more than 3 minutes (180,000 milliseconds), return 0
    if (delay > 180000) {
        return 0;
    }
    return delay;
}


(async function loginExample() {
    let driver = await initializeDriver();
    let userSettings = await getUserPreferences();
    let userlogin = await getUserLogin();
    
    try {
        await loginUser(driver, userlogin[0], userlogin[1]);
        await navigateToBookingPage(driver);

        // Get sunset time for San Diego
        const sanDiegoCoords = { lat: 32.7157, lng: -117.1611 };
        const sunsetTime = SunCalc.getTimes(new Date(), sanDiegoCoords.lat, sanDiegoCoords.lng).sunset;
        const sunsetTimeLocal = new Date(sunsetTime.getTime() - 7 * 60 * 60 * 1000); // Subtract 7 hours for PDT
        console.log(sunsetTimeLocal);

        const lastTimeInMinutes = timeToMinutes(sunsetTimeLocal.getHours() + ':' + sunsetTimeLocal.getMinutes()) + 250;
        let defaultStartTime = "5:00am";
        let startTimeVariable = defaultStartTime;

        await selectTimeSlot(driver, startTimeVariable, lastTimeInMinutes);

    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        setTimeout(() => driver.quit(), 300000); //Quit after 5 minutes
    }
})();