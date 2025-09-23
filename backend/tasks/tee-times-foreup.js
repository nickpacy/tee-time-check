// teeTimes.js
const axios = require("axios");
const dotenv = require("dotenv");
const util = require("./utility");
const { Resend } = require("resend");
const mysql = require("mysql2/promise");

dotenv.config();

let dbPool; // set by init()

function init(pool) {
  dbPool = pool;
}

/** Constants for app_settings keys */
const APP_KEYS = {
  TP_TOKEN: "TorreyPinesToken",
  LAST_EMAIL: "LastTokenExpiredEmailSent",
};

/** Format YYYY-MM-DD in America/Los_Angeles to avoid “double send” due to UTC rollovers */
function todayPST() {
  const tz = "America/Los_Angeles";
  const d = new Date();
  // 2025-09-18 style
  const year = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric" }).format(d);
  const month = new Intl.DateTimeFormat("en-CA", { timeZone: tz, month: "2-digit" }).format(d);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz, day: "2-digit" }).format(d);
  return `${year}-${month}-${day}`;
}

async function getTeeTimes(bookingClass, dayOfWeek, numPlayers, scheduleId) {
  // Normalize/guard
  const players = Number(numPlayers) || 1;
  const bClass = Number(bookingClass);

  const dateStr = util.getClosestDayOfWeek(dayOfWeek);

  // Prefer params object over string concatenation
  const params = new URLSearchParams({
    time: "all",
    date: String(dateStr),
    holes: "all",
    players: String(players),
    booking_class: String(bClass),
    schedule_id: String(scheduleId),
    api_key: "no_limits",
  });

  /** Shared axios config */
  const config = {
    headers: {}
    // You can enable this per-need:
    // validateStatus: (s) => s >= 200 && s < 500,
  };

  // Torrey Pines requires bearer for certain booking classes
  if (bClass === 888 || bClass === 1135) {
    let bearer = await getTorreyPinesBearerToken();
    if (!bearer) {
      console.log("getTeeTimes: No bearer token found. Refreshing token.");
      const refreshed = await refreshTorreyPinesBearerToken();
      bearer = await getTorreyPinesBearerToken();
      if (!refreshed || !bearer) {
        console.warn("getTeeTimes: Token refresh failed.");
      }
    }
    if (bearer) {
      config.headers["X-Authorization"] = `Bearer ${bearer}`;
    }
  }

  try {
    const url = "https://foreupsoftware.com/index.php/api/booking/times";
    const response = await axios.get(`${url}?${params.toString()}`, config);
    

    // Map only what you use; keep raw available too if you want later
    const teeTimes = Array.isArray(response.data)
      ? response.data.map((item) => ({
          time: item?.time ?? null,
          available_spots: item?.available_spots ?? null,
        }))
      : [];

    return teeTimes;
  } catch (error) {
    // Handle 401 “permission” error specifically, and only email once/day (PST)
    const status = error?.response?.status;
    const msg = error?.response?.data?.msg || error?.response?.data?.message || "";

    if ((status === 401 && typeof msg === "string" && msg.includes("You do not have permissions to use this booking class")) || status === 403 || status === 500) {
      if (await shouldSendEmail()) {
        try {
          const refreshed = await refreshTorreyPinesBearerToken();
          const subject = refreshed ? "Success Reset Bearer Token" : "Failed Reset Bearer Token";
          const message = refreshed
            ? "Successfully refreshed ForeUp bearer token for Algoteé."
            : "Error refreshing token. You need to reset the ForeUp token for Algoteé manually.";

          try {
            await sendMail({
              from: "Reset Bearer <info@algotee.com>",
              to: "nickpacy@gmail.com",
              subject,
              html: `<p>${message}</p>`,
            });
            await updateEmailSentDate();
          } catch (mailErr) {
            console.error("Error sending email:", mailErr);
          }
        } catch (refreshErr) {
          console.error("An error occurred during token refresh:", refreshErr);
        }
      }
    } else {
      console.error("getTeeTimes error:", {
        message: error?.message,
        status,
        detail: msg || "n/a",
      });
    }

    // Fail soft with an empty list
    return [];
  }
}

async function getForeupToken(username, password, courseId) {
  if (!username || !password) {
    console.error("Username and password are required to get ForeUp token.");
    return null;
  }

  try {
    const basePayload = {
      username: String(username),
      password: String(password),
      course_id: String(courseId),
    };

    const headers = {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Api-key": "no_limits",
    };

    const params = new URLSearchParams();
    Object.entries(basePayload).forEach(([k, v]) => params.append(k, v));

    const resp = await axios.post(
      "https://foreupsoftware.com/index.php/api/booking/users/login",
      params,
      { headers, timeout: 15_000 }
    );

    return resp?.data?.jwt ?? null;
  } catch (error) {
    console.error("Error getting ForeUp token:", error?.message);
    return null;
  }
}

const sendMail = async (mail) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: mail.from,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
  });
};

async function shouldSendEmail() {
  const today = todayPST(); // PST date string
  const [rows] = await dbPool.query(
    "SELECT SettingValue FROM app_settings WHERE SettingKey = ?",
    [APP_KEYS.LAST_EMAIL]
  );

  return rows.length === 0 || rows[0].SettingValue !== today;
}


async function updateEmailSentDate() {
  const today = todayPST();
  await dbPool.query(
    `INSERT INTO app_settings (SettingKey, SettingValue)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE SettingValue = VALUES(SettingValue);`,
    [APP_KEYS.LAST_EMAIL, today]
  );
}

async function updateTorreyPinesTokenInDB(jwt) {
  if (!jwt) return false;
  try {
    await dbPool.query(
      `INSERT INTO app_settings (SettingKey, SettingValue)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE SettingValue = VALUES(SettingValue);`,
      [APP_KEYS.TP_TOKEN, jwt]
    );
    return true;
  } catch (error) {
    console.error("updateTorreyPinesTokenInDB error:", error);
    return false;
  }
}

async function getTorreyPinesBearerToken() {
  try {
    const [rows] = await dbPool.query(
      "SELECT SettingValue FROM app_settings WHERE SettingKey = ?",
      [APP_KEYS.TP_TOKEN]
    );
    return rows.length > 0 ? rows[0].SettingValue : null;
  } catch (error) {
    console.error("getTorreyPinesBearerToken error:", error);
    return null;
  }
}

async function getTorreyPinesLogin(userId) {
  let email = "";
  let password = "";

  try {
    const query =
      "SELECT SettingKey, SettingValue FROM user_settings WHERE UserId = ? AND SettingKey LIKE '%TorreyPinesLogin%';";
    const [results] = await dbPool.query(query, [userId]);

    for (const entry of results) {
      if (entry.SettingKey === "TorreyPinesLoginEmail") {
        email = entry.SettingValue;
      } else if (entry.SettingKey === "TorreyPinesLoginPassword") {
        password = util.decrypt(entry.SettingValue);
      }
    }
    return [email, password];
  } catch (error) {
    console.error("getTorreyPinesLogin error:", error);
    return ["", ""];
  }
}

/**
 * Refreshes the Torrey Pines ForeUp JWT using stored creds (UserId 1 by default),
 * persists it to app_settings, and returns true/false for success.
 */
async function refreshTorreyPinesBearerToken(userId = 1, courseId = 19347) {
  try {
    const [email, password] = await getTorreyPinesLogin(userId);
    if (!email || !password) {
      console.warn("refreshTorreyPinesBearerToken: missing email/password.");
      return false;
    }
    const jwt = await getForeupToken(email, password, courseId);
    if (!jwt) return false;
    return updateTorreyPinesTokenInDB(jwt);
  } catch (error) {
    console.error("refreshTorreyPinesBearerToken error:", error);
    return false;
  }
}

module.exports = {
  init,
  getTeeTimes,
  // Exporting these can help during ops or tests:
  refreshTorreyPinesBearerToken,
  getTorreyPinesBearerToken,
};