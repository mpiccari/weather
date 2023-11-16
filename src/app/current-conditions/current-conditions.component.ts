import {Component, inject, Signal} from '@angular/core';
import {WeatherService} from "../weather.service";
import {LocationService} from "../location.service";
import {Router} from "@angular/router";
import {ConditionsAndZip} from '../conditions-and-zip.type';
import { TabModel } from 'app/dynamic-tabs-content/dynamic-tabs-content.component';

@Component({
  selector: 'app-current-conditions',
  templateUrl: './current-conditions.component.html',
  styleUrls: ['./current-conditions.component.css']
})
export class CurrentConditionsComponent {
  private weatherService = inject(WeatherService);
  private locationService = inject(LocationService);
  protected currentConditionsByZip: Signal<ConditionsAndZip[]> = this.weatherService.getCurrentConditions();

  getTabsArray(): TabModel[] {
    return this.currentConditionsByZip().map(el => ({
      contextTmplObj: el,
      templateKey: 'locationTmpl',
      tabTitle: el.data.name + ' (' + el.zip + ')'
    }));
  }

  removeTab(tabInfo: {tab: TabModel, index: number}) {
    this.locationService.removeLocation((<ConditionsAndZip> tabInfo.tab.contextTmplObj).zip);
  }
}
