import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { MetricService } from 'src/app/main/service/metric.service';
import * as Highcharts from 'highcharts';
import { UtilityService } from 'src/app/main/service/utility.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: "app-user-by-course",
  templateUrl: "./user-by-course.component.html",
  styleUrls: ["./user-by-course.component.scss"],
})
export class UserByCourseComponent implements OnInit {
  startDate: Date;
  endDate: Date;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options;

  constructor(
    private metricService: MetricService,
    private layoutService: LayoutService,
    private utilityService: UtilityService
  ) {}

  ngOnInit() {
    this.endDate = new Date();
    this.startDate = new Date();
    this.startDate.setDate(this.startDate.getDate() - 30);
    this.getNotificationsByCourseAndUser();
  }

  onDateChange(): void {
    if (this.startDate && this.endDate) {
      this.getNotificationsByCourseAndUser();
    }
  }

  async getNotificationsByCourseAndUser() {
    const data = await firstValueFrom(
      this.metricService.getNotificationsByCourseAndUser(
        this.startDate,
        this.endDate
      )
    );
    this.setupChart(data);
  }

  setupChart(data: any) {
    this.chartOptions = {
      chart: {
        type: "column",
      },
      title: {
        text: `Tee Times Found By Course ${this.utilityService.formatDateToMMDDYY(
          this.startDate
        )} - ${this.utilityService.formatDateToMMDDYY(this.endDate)}`,
      },
      xAxis: {
        categories: data.categories, // Set categories from the data passed
        title: {
          text: null,
        },
      },
      yAxis: {
        min: 0,
        title: {
          text: this.layoutService.isMobile() ? "" : "Tee Time Count",
          align: "high",
        },
        labels: {
          overflow: "justify",
        },
      },
      tooltip: {
        valueSuffix: " tee times",
      },
      plotOptions: {
        column: {
          stacking: "normal",
        },
        series: {
          cursor: "pointer",
          point: {
            events: {
              click: (event) =>
                this.onBarClick(event.point.category, event.point.series.name),
            },
          },
        },
      },
      legend: {
        reversed: true, // Optional: Reverse the legend order to match the stack order
      },
      series: data.series.map((seriesItem: any) => {
        return {
          name: seriesItem.name,
          data: seriesItem.data,
        };
      }),
    };

    // Trigger the chart update
    if (this.Highcharts.charts[0]) {
      this.Highcharts.charts[0].update(this.chartOptions, true, true);
    }
  }

  onBarClick(courseName: string | number, userName: string) {
    // Fetch the data for the selected course and user
    console.log(courseName, userName);
  }
}
