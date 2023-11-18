import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';
const SunCalc = require('suncalc');

@Injectable({
  providedIn: "root",
})
export class UtilityService {
  constructor(private datePipe: DatePipe) {}

  dayName(dayOfWeek: number, short: boolean = false) {
    const date = new Date();
    date.setDate(date.getDate() + dayOfWeek - date.getDay());
    const formattedDay = this.datePipe.transform(date, "EEEE");

    if (short) {
      return formattedDay ? formattedDay.toString().substring(0, 3) : "";
    }
    return formattedDay ? formattedDay.toString() : "";
  }

  formatDateToMMDDYY(date) {
    if (typeof date === "string") {
      date = new Date(date);
    }

    if (isNaN(date.getTime())) {
      return ""; // or some default value or error handling
    }

    let month = "" + (date.getMonth() + 1), // months are 0-based
      day = "" + date.getDate(),
      year = date.getFullYear().toString().substr(-2); // get last two digits

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return `${month}/${day}/${year}`;
  }

  formatToHHMM(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  localTime(time: string): Date {
    const [utcHours, utcMinutes] = time.split(":").map(Number);
    const date = new Date();
    date.setUTCHours(utcHours);
    date.setUTCMinutes(utcMinutes);
    return date;
  }

  localTimeString(time: string): string {
    const timeParts = time.split(":");
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    const formattedTime = this.datePipe.transform(date, "h:mm a");
    return formattedTime ? formattedTime.toString() : "";
  }

  utcTime(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  convertTimeToInterval(start: string, end: string, utc = true): number[] {
    var startInterval;
    var endInterval;
    if (utc) {
      startInterval = this.convertToIntervalNumber(start);
      endInterval = this.convertToIntervalNumber(end);
    } else {
      startInterval = this.convertLocalToIntervalNumber(start);
      endInterval = this.convertLocalToIntervalNumber(end);
    }

    // if (startInterval > endInterval) {
    //   throw new Error('Invalid time range: Start time is after end time');
    // }

    return [startInterval, endInterval];
  }

  convertToIntervalNumber(time: string): number {
    const [hoursString, minutesString, secondsString] = time.split(":");

    const date = new Date();
    date.setUTCHours(parseInt(hoursString));
    date.setUTCMinutes(parseInt(minutesString));
    date.setUTCSeconds(parseInt(secondsString));

    const interval =
      (date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60) / 15;

    return Math.floor(interval);
  }

  convertLocalToIntervalNumber(time: string): number {
    const [hoursString, minutesString, secondsString] = time.split(":");

    const date = new Date();
    date.setHours(parseInt(hoursString));
    date.setMinutes(parseInt(minutesString));
    date.setSeconds(parseInt(secondsString));

    const interval =
      (date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60) / 15;

    return Math.floor(interval);
  }

  convertIntervalToLocalTimeString(interval: number): string {
    const localDate = new Date();
    localDate.setHours(Math.floor(interval / 4), (interval % 4) * 15, 0, 0);
    return this.datePipe.transform(localDate, "HH:mm");
  }

  convertIntervalToUTCTimeString(interval: number): string {
    const localDate = new Date();
    localDate.setHours(Math.floor(interval / 4), (interval % 4) * 15, 0, 0);

    const utcHours = localDate.getUTCHours().toString().padStart(2, "0");
    const utcMinutes = localDate.getUTCMinutes().toString().padStart(2, "0");
    const utcSeconds = localDate.getUTCSeconds().toString().padStart(2, "0");

    const utcTimeString = `${utcHours}:${utcMinutes}:${utcSeconds}`;

    return utcTimeString;
  }

  convertIntervalToTime(interval: number): string {
    if (!interval) {
      return "false";
    }
    const hours = Math.floor(interval / 4);
    const minutes = (interval % 4) * 15;

    const formattedHours = hours === 0 || hours === 12 ? 12 : hours % 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const period = hours < 12 ? "AM" : "PM";

    return `${formattedHours}:${formattedMinutes} ${period}`;
  }

  roundToNearest15Minutes(date) {
    let minutes = date.getMinutes();
    const remainder = minutes % 15;
    if (remainder >= 8) {
      // If it's closer to the next quarter hour
      minutes += 15 - remainder;
    } else {
      // If it's closer to the current quarter hour
      minutes -= remainder;
    }

    date.setMinutes(minutes);
    date.setSeconds(0); // Resetting seconds to zero
    return date;
  }

  getSunTimes() {
    const sanDiegoCoords = { lat: 32.7157, lng: -117.1611 };
    const currentTime = new Date();

    const sunriseTime = SunCalc.getTimes(
      currentTime,
      sanDiegoCoords.lat,
      sanDiegoCoords.lng
    ).sunrise;
    const sunsetTime = SunCalc.getTimes(
      currentTime,
      sanDiegoCoords.lat,
      sanDiegoCoords.lng
    ).sunset;

    // Subtract 10 minutes from sunrise
    sunriseTime.setMinutes(sunriseTime.getMinutes() - 10);

    // Subtract 4 hours from sunset
    sunsetTime.setHours(sunsetTime.getHours() - 4);
    // Add 10 minutes to sunset
    sunsetTime.setMinutes(sunsetTime.getMinutes() + 10);

    // Round to nearest 15th minute
    const roundedSunrise = this.roundToNearest15Minutes(sunriseTime);
    const roundedSunset = this.roundToNearest15Minutes(sunsetTime);

    return this.convertTimeToInterval(
      this.formatToHHMM(roundedSunrise),
      this.formatToHHMM(roundedSunset),
      false
    );
  }

  transformKeysToCamelCase(obj: any): any {
    const output: { [key: string]: any } = {}; // Declare output as an object with string keys
    for (let key in obj) {
      let newKey = this.toCamelCase(key);
      output[newKey] = obj[key];
    }
    return output;
  }

  toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}