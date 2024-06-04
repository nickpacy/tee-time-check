import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { MetricService } from 'src/app/main/service/metric.service';
import * as Highcharts from 'highcharts';
import darkTheme from 'highcharts/themes/brand-dark';
import lightTheme from 'highcharts/themes/brand-light';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: "app-user-by-week",
  templateUrl: "./user-by-week.component.html",
  styleUrls: ["./user-by-week.component.scss"],
})
export class UserByWeekComponent implements OnInit {
  public categories: string[] = [];
  public weeks = this.layoutService.isMobile() ? 4 : 12;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options;

  constructor(
    private metricService: MetricService,
    private layoutService: LayoutService
  ) {}

  ngOnInit() {
    darkTheme(Highcharts);
    this.getNotificationsByCourse();
  }

  addWeek() {
    ++this.weeks;
    this.getNotificationsByCourse();
  }

  async getNotificationsByCourse() {
    const data = await firstValueFrom(
      this.metricService.getNotificationsByCourse(this.weeks)
    );
    this.categories = data.categories;
    this.setupChart(data);
  }

  setupChart(data: any) {
    this.chartOptions = {
      series: data.series.map((seriesItem: any) => {
        return {
          data: seriesItem.data,
          type: 'area',
          name: seriesItem.name,
        };
      }),
      plotOptions: {
        area: {
          stacking: 'normal',
        },
      },
      xAxis: {
        categories: this.categories,
        labels: {
          formatter: function () {
            const date = new Date(this.value);
            const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
            const day = ('0' + date.getUTCDate()).slice(-2);
            return `${month}-${day}`;
          },
        },
      },
      yAxis: {
        title: {
          text: this.layoutService.isMobile() ? '' : 'Tee Time Count',
        },
      },
      title: {
        text: 'Tee Times Found By Course',
      },
    };

    // Trigger the chart update (if using Highcharts wrapper for Angular)
    if (this.Highcharts.charts[0]) {
      this.Highcharts.charts[0].update(this.chartOptions, true, true);
    }
  }
}
