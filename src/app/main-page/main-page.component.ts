import { Component, OnInit } from '@angular/core';
import { CACHE_TIME_KEY, DEFAULT_RESPONSES_CACHE_TIME_IN_MILLISECONDS } from 'app/weather.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit{
  cacheTimeModel: string = "";
  actualCacheValueSec: number = DEFAULT_RESPONSES_CACHE_TIME_IN_MILLISECONDS / 1000;

  ngOnInit(): void {
    let cachedTimeValue: string | undefined = localStorage.getItem(CACHE_TIME_KEY);
    if(cachedTimeValue) {
      this.actualCacheValueSec = +cachedTimeValue;
    }
  }
  
  restoreCacheTimeValue() {
    localStorage.removeItem(CACHE_TIME_KEY);
    this.actualCacheValueSec = DEFAULT_RESPONSES_CACHE_TIME_IN_MILLISECONDS / 1000;
    this.cacheTimeModel = "";
  }

  changeCacheTimeValue() {
    if(!this.cacheTimeModel || !this.cacheTimeModel.trim().length) {
      alert("insert a value for cache time");
    }
    else if(isNaN(+this.cacheTimeModel)) {
      alert("this value isn't a number");
    } else if(+this.cacheTimeModel < 0 ) {
      alert(" this value can't be negative");
    } else {
      localStorage.setItem(CACHE_TIME_KEY, this.cacheTimeModel); //value saved in ms
      this.actualCacheValueSec = +this.cacheTimeModel;
    }
  }
}
