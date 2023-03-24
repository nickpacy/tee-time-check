import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localTime'
})
export class LocalTimePipe implements PipeTransform {

    transform(utcTime: string): string {
        const [utcHours, utcMinutes] = utcTime.split(':');
        const date = new Date();
        date.setUTCHours(Number(utcHours));
        date.setUTCMinutes(Number(utcMinutes));
        const localTime = new DatePipe('en-US').transform(date, 'shortTime');
        return localTime ?? '';
    }

}