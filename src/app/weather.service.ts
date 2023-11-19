import {Injectable, OnDestroy, Signal, signal} from '@angular/core';
import {Observable, Subscription, of} from 'rxjs';
import { tap } from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {CurrentConditions} from './current-conditions/current-conditions.type';
import {ConditionsAndZip} from './conditions-and-zip.type';
import {Forecast} from './forecasts-list/forecast.type';
import { LocationService } from './location.service';

const LOCATIONS : string = "locations"
const RESPONSES_CACHE_TIME : string = "responses_cache_time" //Utility for testing responses cache
const ZIPS_CONDITION : string = "zips_condition";
const ZIPS_FORECAST : string = "zips_forecast";
export const DEFAULT_RESPONSES_CACHE_TIME_IN_MILLISECONDS: number = 20000;//7200000; //2h = 60 x 60 x 2 x 1000 ms
interface CacheZipDates {zip: string, dates: CurrentConditions | Forecast, lastUpdate: number};
@Injectable()
export class WeatherService implements OnDestroy {

  static URL = 'http://api.openweathermap.org/data/2.5';
  static APPID = '5a4b2d457ecbef9eb2a71e480b947604';
  static ICON_URL = 'https://raw.githubusercontent.com/udacity/Sunshine-Version-2/sunshine_master/app/src/main/res/drawable-hdpi/';
  private currentConditions = signal<ConditionsAndZip[]>([]);
  locationsChange$: Subscription; //this subscription manages changes of locations
  responsesCacheTime: number;
  
  constructor(private http: HttpClient, locationService: LocationService) {
    let cacheTimeInStorage: string = localStorage.getItem(RESPONSES_CACHE_TIME);
    this.responsesCacheTime = cacheTimeInStorage ? +cacheTimeInStorage : DEFAULT_RESPONSES_CACHE_TIME_IN_MILLISECONDS;
    let locString: string = localStorage.getItem(LOCATIONS);
    if (locString) {
      (<string[]> JSON.parse(locString)).forEach(zip => this.addCurrentConditions(zip)); //get zips by storage
    }
    
    //with this simple code I manage list of locations changes
    this.locationsChange$ = locationService.getModifyedLocationsAsObs().subscribe(
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
  
  ngOnDestroy(): void {
    this.locationsChange$.unsubscribe();
  }

  addCurrentConditions(zipcode: string): void {
    if(!this.currentConditions().find(cond => cond.zip == zipcode)) {
      // Search if dates are present in browser's cache and in valid cache time interval from last update
      const savedZipConditions: CacheZipDates[] = <CacheZipDates[]> this.getArrayByStorage(ZIPS_CONDITION);
      const zipCondition: CacheZipDates | undefined = savedZipConditions.find(
        date => date.zip == zipcode && new Date().getTime() - date.lastUpdate <= this.responsesCacheTime);
      if(zipCondition) {
        this.currentConditions.mutate(conditions => conditions.push({zip: zipcode, data: <CurrentConditions> zipCondition.dates}));
      } else {
        //get dates by network
        // Here we make a request to get the current conditions data from the API. Note the use of backticks and an expression to insert the zipcode
        this.http.get<CurrentConditions>(`${WeatherService.URL}/weather?zip=${zipcode},us&units=imperial&APPID=${WeatherService.APPID}`)
        .subscribe(data => {
          this.currentConditions.mutate(conditions => conditions.push({zip: zipcode, data}))
          let zipsInStorage: string[] = <string[]> this.getArrayByStorage(LOCATIONS);
          if(!zipsInStorage.find(zip => zip == zipcode)) {
            zipsInStorage.push(zipcode);
            localStorage.setItem(LOCATIONS, JSON.stringify(zipsInStorage));
          }
          //save response in browser's storage
          savedZipConditions.push({zip: zipcode, dates: data, lastUpdate: (new Date()).getTime()});
          localStorage.setItem(ZIPS_CONDITION, JSON.stringify(savedZipConditions));
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
    let zipsInStorage: string[] = <string[]> this.getArrayByStorage(LOCATIONS);
    zipsInStorage.splice(zipsInStorage.findIndex(zip => zip == zipcode), 1);      
    localStorage.setItem(LOCATIONS, JSON.stringify(zipsInStorage));
    this.removeCacheResponsesByZip(ZIPS_CONDITION, zipcode);
    this.removeCacheResponsesByZip(ZIPS_FORECAST, zipcode);
    
  }

  getCurrentConditions(): Signal<ConditionsAndZip[]> {
    return this.currentConditions.asReadonly();
  }

  getForecast(zipcode: string): Observable<Forecast> {
    // Search if dates are present in browser's cache and in valid cache time interval from last update
    const savedZipForecast: CacheZipDates[] = <CacheZipDates[]> this.getArrayByStorage(ZIPS_FORECAST);
    
    const zipForecast: CacheZipDates | undefined = savedZipForecast.find(
      date => date.zip == zipcode && new Date().getTime() - date.lastUpdate <= this.responsesCacheTime);
    if(zipForecast) {
      return of(<Forecast> zipForecast.dates)
    } else {
      //get dates by network
      // Here we make a request to get the forecast data from the API. Note the use of backticks and an expression to insert the zipcode
      return this.http.get<Forecast>(`${WeatherService.URL}/forecast/daily?zip=${zipcode},us&units=imperial&cnt=5&APPID=${WeatherService.APPID}`)
        .pipe(tap((response: Forecast) => {
          //save response in browser's storage
          savedZipForecast.push({zip: zipcode, dates: response, lastUpdate: (new Date()).getTime()});
          localStorage.setItem(ZIPS_FORECAST, JSON.stringify(savedZipForecast));
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

  getArrayByStorage(key: string): string[] | CacheZipDates[] {
    let data: string = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  removeCacheResponsesByZip(key: string, zipcode: string) {
    let cacheString: string = localStorage.getItem(key);
    if(cacheString) {
      let cache: CacheZipDates[] = JSON.parse(cacheString);
      let indexDates: number = cache.findIndex(cacheEl => cacheEl.zip == zipcode);
      if(indexDates >= 0) {
        cache.splice(indexDates, 1);
        localStorage.setItem(key, JSON.stringify(cache));
      }
    }
  }
}
