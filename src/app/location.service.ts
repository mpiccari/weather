import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type LOCATIONS_OPS = 'addZip' | 'removeZip';

@Injectable()
export class LocationService {
  //locations has been removed and replaced with this Subject that notify list locations changes
  private _modifyedLocations$ : Subject<{op: LOCATIONS_OPS, zip: string}> = new Subject<{op: LOCATIONS_OPS, zip: string}>();

  //WeatherService has been removed
  constructor() {}

  getModifyedLocationsAsObs(): Observable<{op: LOCATIONS_OPS, zip: string}> {
    return this._modifyedLocations$.asObservable();
  }

  addLocation(zipcode : string) {
    this._modifyedLocations$.next({op: 'addZip', zip: zipcode});
  }

  removeLocation(zipcode : string) {
    this._modifyedLocations$.next({op: 'removeZip', zip: zipcode});
  }
}
