import { Component, Input, TemplateRef } from "@angular/core";

@Component({
    selector: 'app-dynamic-tabs-content',
    templateUrl: './dynamic-tabs-content.component.html',
    styleUrls: ['./dynamic-tabs-content.component.css']
  })

  export class DynamicTabsContentComponent {
    @Input() tabs: {city: string, templateTagName: string}[];
    @Input() templates: {key: string, content: TemplateRef<any>}[]
    activeTab: number = 0;

    getTemplateRef(indice : number): TemplateRef<any> {
      return this.templates.find(template => 
        template.key == this.tabs[indice].templateTagName
      ).content;
    }
  }
