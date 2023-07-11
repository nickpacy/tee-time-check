import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';


@Injectable({
  providedIn: 'root'
})
export class UtilityService {

    constructor(private datePipe: DatePipe) {}


    dayName(dayOfWeek: number) {
        const date = new Date();
        date.setDate(date.getDate() + dayOfWeek - date.getDay());
        const formattedDay = this.datePipe.transform(date, 'EEEE');
        return formattedDay ? formattedDay.toString() : '';
    }

    localTime(time: string): Date {
        const [utcHours, utcMinutes] = time.split(':').map(Number);
        const date = new Date();
        date.setUTCHours(utcHours);
        date.setUTCMinutes(utcMinutes);
        return date;
        
    }

    localTimeString(time: string): string {
        const timeParts = time.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        const formattedTime = this.datePipe.transform(date, 'h:mm a');
        return formattedTime ? formattedTime.toString() : '';
        
    }

    utcTime(date: Date): string {
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    convertTimeToInterval(start: string, end: string): number[] {
        const startInterval = this.convertToIntervalNumber(start);
        const endInterval = this.convertToIntervalNumber(end);
      
        // if (startInterval > endInterval) {
        //   throw new Error('Invalid time range: Start time is after end time');
        // }
      
        return [startInterval, endInterval];
      }
      
    convertToIntervalNumber(time: string): number {
        const [hoursString, minutesString, secondsString] = time.split(':');
      
        const date = new Date();
        date.setUTCHours(parseInt(hoursString));
        date.setUTCMinutes(parseInt(minutesString));
        date.setUTCSeconds(parseInt(secondsString));
      
        const interval = (date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60) / 15;
      
        return Math.floor(interval);
    }

    convertIntervalToUTCTimeString(interval: number): string {
        const localDate = new Date();
        localDate.setHours(Math.floor(interval / 4), (interval % 4) * 15, 0, 0);

        const utcHours = localDate.getUTCHours().toString().padStart(2, '0');
        const utcMinutes = localDate.getUTCMinutes().toString().padStart(2, '0');
        const utcSeconds = localDate.getUTCSeconds().toString().padStart(2, '0');

        const utcTimeString = `${utcHours}:${utcMinutes}:${utcSeconds}`;

        return utcTimeString;
    }

}