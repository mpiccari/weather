import { Component, Input, inject } from "@angular/core";
import { Router } from "@angular/router";
import { ConditionsAndZip } from "../conditions-and-zip.type";
import { LocationService } from "../location.service";
import { WeatherService } from "../weather.service";

@Component({
    selector: 'app-location-card',
    templateUrl: './location-card.component.html',
    styleUrls: ['./location-card.component.css']
  })
  
export class LocationCardComponent {
    @Input() location: ConditionsAndZip;
    private weatherService = inject(WeatherService);
    private router = inject(Router);
    private locationService = inject(LocationService);
    
    showForecast(zipcode : string){
        this.router.navigate(['/forecast', zipcode])
    }

    getImage(): string {
        return this.weatherService.getWeatherIcon(this.location.data.weather[0].id)
    }

    removeLocation() {
        this.locationService.removeLocation(this.location.zip);
    }
}