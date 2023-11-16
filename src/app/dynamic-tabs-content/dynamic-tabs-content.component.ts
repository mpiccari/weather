import { Component, EventEmitter, Input, Output, TemplateRef } from "@angular/core";

export interface TabModel {
  contextTmplObj?: any;
  templateKey: string;
  tabTitle: string;
}
@Component({
    selector: 'app-dynamic-tabs-content',
    templateUrl: './dynamic-tabs-content.component.html',
    styleUrls: ['./dynamic-tabs-content.component.css']
  })

  export class DynamicTabsContentComponent {
    /* as inputs: Every tab in this component has a contents template associated.
    Each template is represented in an ng-template sent to the component via 
    content projection feature. templates input is a list of all this ng-template
    ElementRef and their associated string keys. tabs input is a list of all tabs 
    of the component. For each tab we have tab title, template object context 
    (not mandatory) and string key associated with its ElementRef template. Finally
    for a correct rendering of each tab in html component file we need of directive
    ngTemplateOutlet that make use for each tab of his templateRef and his 
    template object context (if pesent).*/
    
    @Input() tabs: TabModel[];
    @Input() areRemovableTabs: boolean;
    @Input() templates: {key: string, content: TemplateRef<any>}[];
    @Output() removeTabEmitter: EventEmitter<{tab: TabModel, index: number}> = 
      new EventEmitter<{tab: TabModel, index: number}>();
    activeTab: number = 0;

    getTemplateRef(indice : number): TemplateRef<any> {
      return this.templates.find(template => 
        template.key == this.tabs[indice].templateKey
      ).content;
    }

    removeTab(tab: TabModel, index: number) {
      this.removeTabEmitter.emit({tab, index});
      if(index == this.activeTab && this.activeTab == this.tabs.length - 1) {
        this.activeTab = 0;
      }
    }
  }
