import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export const LOCATIONS : string = "locations";

@Injectable()
export class LocationService {
  //locations has been removed and replaced with this BeahiourSubject
  private _locations$ : BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  //WeatherService has been removed
  constructor() {
    let locString = localStorage.getItem(LOCATIONS);
    if (locString) {
      this._locations$.next(JSON.parse(locString));
    }
  }

  getLocationsAsObs(): Observable<string[]> {
    return this._locations$.asObservable();
  }

  addLocation(zipcode : string) {
    let locationsList: string[] = this._locations$.value;
    locationsList.push(zipcode);
    localStorage.setItem(LOCATIONS, JSON.stringify(locationsList));
    this._locations$.next(locationsList);
  }

  removeLocation(zipcode : string) {
    let locationsList: string[] = this._locations$.value;
    let index: number = locationsList.indexOf(zipcode);
    if (index !== -1){
      locationsList.splice(index, 1);
      localStorage.setItem(LOCATIONS, JSON.stringify(locationsList));
      this._locations$.next(locationsList);
    }
  }
}
