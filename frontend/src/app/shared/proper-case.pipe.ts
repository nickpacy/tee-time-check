import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'properCase'
})
export class ProperCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return value;
    return value.replace(/\w\S*/g, (txt) => {
      return txt[0].toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
}
