import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { MetricService } from 'src/app/main/service/metric.service';

@Component({
  selector: 'app-user-by-week',
  templateUrl: './user-by-week.component.html',
  styleUrls: ['./user-by-week.component.scss']
})

export class UserByWeekComponent implements OnInit {

  public categories: string[] = [];
  public weeks = this.layoutService.isMobile() ? 4 : 12
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options;

  constructor(private metricService: MetricService,
              private layoutService: LayoutService) {}

  ngOnInit() {
    this.getNotificationsByCourse()
  }

  addWeek() {
    ++this.weeks
    this.getNotificationsByCourse();
  }

  getNotificationsByCourse() {
    return new Promise((resolve, reject) => {
      this.metricService.getNotificationsByCourse(this.weeks)
        .subscribe(res => {
          this.categories = res.categories;
          this.setupChart(res);

          resolve(true)
        }, (error: any) => {
          console.error(error);
          reject(true);
        });

    });
  }

  setupChart(data: any) {
    this.chartOptions = {
        series: data.series.map((seriesItem: any) => {
            return {
                data: seriesItem.data,
                type: 'area',
                name: seriesItem.name
            };
        }),
        plotOptions: {
            area: {
                stacking: 'normal'
            }
        },
        xAxis: {
          categories: this.categories,
          labels: {
            formatter: function() {
              const date = new Date(this.value);
              const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
              const day = ("0" + date.getUTCDate()).slice(-2);
              return `${month}-${day}`;
            }
          }
        },
        yAxis: {
            title: {
                text: this.layoutService.isMobile() ? '' : 'Tee Time Count'
            }
        },
        title: {
          text: 'Tee Times Found By Course'
        }
    };

    // Trigger the chart update (if using Highcharts wrapper for Angular)
    if (this.Highcharts.charts[0]) {
        this.Highcharts.charts[0].update(this.chartOptions, true, true);
    }
}


generateAllWeeksBetweenDates(startDate: Date, endDate: Date): string[] {
  const weekDates: string[] = [];

  while (startDate <= endDate) {
      weekDates.push(startDate.toISOString());
      // Increment by 7 days
      startDate = new Date(startDate.setDate(startDate.getDate() + 7));
  }

  return weekDates;
}
  
}
