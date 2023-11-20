import {Injectable, Signal, signal} from '@angular/core';
import {Observable, of} from 'rxjs';
import { tap } from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {CurrentConditions} from './current-conditions/current-conditions.type';
import {ConditionsAndZip} from './conditions-and-zip.type';
import {Forecast} from './forecasts-list/forecast.type';
import { LocationService } from './location.service';

//in browser's storage we will find a list of CacheZipDates
interface CacheZipDates { 
  zip: string, 
  currentConditionCached?: {
    dates: CurrentConditions,
    lastUpdate: number
  },
  currentForecastCached?: {
    dates: Forecast,
    lastUpdate: number
  }
};
const LOCATIONS : string = "locations"; //key for zip's list in browser's storage
export const DEFAULT_RESPONSES_CACHE_TIME_IN_MILLISECONDS: number = 7200000; //2h = 60 x 60 x 2 x 1000 ms
export const CACHE_TIME_KEY : string = "cacheTime"; 

@Injectable()
export class WeatherService {

  static URL = 'http://api.openweathermap.org/data/2.5';
  static APPID = '5a4b2d457ecbef9eb2a71e480b947604';
  static ICON_URL = 'https://raw.githubusercontent.com/udacity/Sunshine-Version-2/sunshine_master/app/src/main/res/drawable-hdpi/';
  cacheTime = DEFAULT_RESPONSES_CACHE_TIME_IN_MILLISECONDS;
    
  private currentConditions = signal<ConditionsAndZip[]>([]);

  locations: CacheZipDates[] = [];
  
  constructor(private http: HttpClient, locationService: LocationService) {
    let cachedTimeValueInBrowser: string = localStorage.getItem(CACHE_TIME_KEY);
    if(cachedTimeValueInBrowser) {
      this.cacheTime = +cachedTimeValueInBrowser * 1000; //conversion from seconds to milliseconds
    }
    let locString: string = localStorage.getItem(LOCATIONS);
    if (locString) {
      this.locations = <CacheZipDates[]> JSON.parse(locString);
      this.locations.forEach(el => this.addCurrentConditions(el.zip));
    }
    //with this simple code I manage list of locations changes
    locationService.getModifyedLocationsAsObs().subscribe(
      zipsChange => {
        switch(zipsChange.op) {
          case 'addZip':
            this.addCurrentConditions(zipsChange.zip);
            break;
          case 'removeZip':
            this.removeCurrentConditions(zipsChange.zip);
            break;
        }
      }
    )
  }
  
  addCurrentConditions(zipcode: string): void {
    if(!this.currentConditions().find(cond => cond.zip == zipcode)) {
      // Search if dates are present in browser's cache and in valid cache time interval from last update
      let zipCodeCached: CacheZipDates | undefined = this.locations.find(loc => loc.zip == zipcode);
      if(zipCodeCached && zipCodeCached.currentConditionCached && 
        (new Date()).getTime() - zipCodeCached.currentConditionCached.lastUpdate < this.cacheTime) {
        this.currentConditions.mutate(conditions => conditions.push({zip: zipcode, data: zipCodeCached.currentConditionCached.dates}));
      } else {
        //get dates by network
        // Here we make a request to get the current conditions data from the API. Note the use of backticks and an expression to insert the zipcode
        this.http.get<CurrentConditions>(`${WeatherService.URL}/weather?zip=${zipcode},us&units=imperial&APPID=${WeatherService.APPID}`)
        .subscribe(data => {
          this.currentConditions.mutate(conditions => conditions.push({zip: zipcode, data}))
          if(!zipCodeCached) {
            zipCodeCached = {zip: zipcode};
            this.locations.push(zipCodeCached);
          }
          zipCodeCached.currentConditionCached = {dates: data, lastUpdate: (new Date()).getTime()}
          //save to browser's storage
          localStorage.setItem(LOCATIONS, JSON.stringify(this.locations));
        });
      }
    }
  }

  removeCurrentConditions(zipcode: string) {
    this.currentConditions.mutate(conditions => {
      for (let i in conditions) {
        if (conditions[i].zip == zipcode)
          conditions.splice(+i, 1);
      }
    })
    this.locations.splice(this.locations.findIndex(el => el.zip == zipcode), 1);
    //save to browser's storage
    localStorage.setItem(LOCATIONS, JSON.stringify(this.locations));
  }

  getCurrentConditions(): Signal<ConditionsAndZip[]> {
    return this.currentConditions.asReadonly();
  }

  getForecast(zipcode: string): Observable<Forecast> {
    // Search if dates are present in browser's cache and in valid cache time interval from last update
    let zipCodeCached: CacheZipDates = this.locations.find(loc => loc.zip == zipcode);
    if(zipCodeCached.currentForecastCached && 
      (new Date()).getTime() - zipCodeCached.currentForecastCached.lastUpdate < this.cacheTime) {
        return of(<Forecast> zipCodeCached.currentForecastCached.dates);
    } else {
      //get dates by network
      // Here we make a request to get the forecast data from the API. Note the use of backticks and an expression to insert the zipcode
      return this.http.get<Forecast>(`${WeatherService.URL}/forecast/daily?zip=${zipcode},us&units=imperial&cnt=5&APPID=${WeatherService.APPID}`)
        .pipe(tap((response: Forecast) => {
          zipCodeCached.currentForecastCached = {dates: response, lastUpdate: (new Date()).getTime()};
          //save to browser's storage
          localStorage.setItem(LOCATIONS, JSON.stringify(this.locations));
        })
      );
    }
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
