import {Injectable, OnDestroy, Signal, signal} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {HttpClient} from '@angular/common/http';
import {CurrentConditions} from './current-conditions/current-conditions.type';
import {ConditionsAndZip} from './conditions-and-zip.type';
import {Forecast} from './forecasts-list/forecast.type';
import { LocationService } from './location.service';

@Injectable()
export class WeatherService implements OnDestroy {

  static URL = 'http://api.openweathermap.org/data/2.5';
  static APPID = '5a4b2d457ecbef9eb2a71e480b947604';
  static ICON_URL = 'https://raw.githubusercontent.com/udacity/Sunshine-Version-2/sunshine_master/app/src/main/res/drawable-hdpi/';
  private currentConditions = signal<ConditionsAndZip[]>([]);
  locationsChangeSub: Subscription; //this subscription manages changes of locations
  
  constructor(private http: HttpClient, locationService: LocationService) {
    this.locationsChangeSub = locationService.getLocationsAsObs().subscribe(
      locations => {
        //search locations not present in currentConditions and add it to currentConditions
        locations.filter(location => !this.currentConditions().find(
          condition => condition.zip == location)
        ).forEach(newLocation => this.addCurrentConditions(newLocation));
        
        /*search zipcodes present in currentConditions and not present in location.
          After I remove it from currentConditions
        */
        this.currentConditions().filter(condition => !locations.find(
          location => location == condition.zip)
        ).forEach(removedZip => this.removeCurrentConditions(removedZip.zip));
      }
    )
  }
  
  ngOnDestroy(): void {
    this.locationsChangeSub.unsubscribe();
  }

  addCurrentConditions(zipcode: string): void {
    // Here we make a request to get the current conditions data from the API. Note the use of backticks and an expression to insert the zipcode
    this.http.get<CurrentConditions>(`${WeatherService.URL}/weather?zip=${zipcode},us&units=imperial&APPID=${WeatherService.APPID}`)
      .subscribe(data => {
        this.currentConditions.mutate(conditions => conditions.push({zip: zipcode, data}))
      });
  }

  removeCurrentConditions(zipcode: string) {
    this.currentConditions.mutate(conditions => {
      for (let i in conditions) {
        if (conditions[i].zip == zipcode)
          conditions.splice(+i, 1);
      }
    })
  }

  getCurrentConditions(): Signal<ConditionsAndZip[]> {
    return this.currentConditions.asReadonly();
  }

  getForecast(zipcode: string): Observable<Forecast> {
    // Here we make a request to get the forecast data from the API. Note the use of backticks and an expression to insert the zipcode
    return this.http.get<Forecast>(`${WeatherService.URL}/forecast/daily?zip=${zipcode},us&units=imperial&cnt=5&APPID=${WeatherService.APPID}`);

  }

  getWeatherIcon(id): string {
    if (id >= 200 && id <= 232)
      return WeatherService.ICON_URL + "art_storm.png";
    else if (id >= 501 && id <= 511)
      return WeatherService.ICON_URL + "art_rain.png";
    else if (id === 500 || (id >= 520 && id <= 531))
      return WeatherService.ICON_URL + "art_light_rain.png";
    else if (id >= 600 && id <= 622)
      return WeatherService.ICON_URL + "art_snow.png";
    else if (id >= 801 && id <= 804)
      return WeatherService.ICON_URL + "art_clouds.png";
    else if (id === 741 || id === 761)
      return WeatherService.ICON_URL + "art_fog.png";
    else
      return WeatherService.ICON_URL + "art_clear.png";
  }
}
