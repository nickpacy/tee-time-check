import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
    private nominatimUrl = 'https://nominatim.openstreetmap.org/search';
    private nominatimReverseUrl = 'https://nominatim.openstreetmap.org/reverse';

  constructor(private http: HttpClient) { }

  getCurrentLocation(): Promise<any> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            this.getReverseGeocodingData(position.coords.latitude, position.coords.longitude)
              .subscribe(
                address => resolve({ position, address }),
                error => reject(error)
              );
          },
          error => reject(error)
        );
      } else {
        reject('Geolocation is not available in your browser');
      }
    });
  }

  getReverseGeocodingData(lat: number, lon: number) {
    const params = {
      format: 'json',
      lat: lat.toString(),
      lon: lon.toString()
    };
    return this.http.get<any>(this.nominatimReverseUrl, { params });
  }

  getCoordinatesFromZip(zipCode: string, country: string = 'USA') {
    const params = {
      format: 'json',
      postalcode: zipCode,
      country: country,
    };
    return this.http.get<any[]>(this.nominatimUrl, { params });
  }
}
