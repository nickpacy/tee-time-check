import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { TimecheckService } from '../../service/timecheck.service';
import { AuthService } from '../auth/auth.service';

@Component({
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {

    USERID!: number;
    activeTimechecks!: number;
    activeCourses!: number;
    items!: MenuItem[];

    // products!: Product[];

    chartData: any;

    chartOptions: any;

    subscription!: Subscription;

    constructor(public layoutService: LayoutService,
                private authService: AuthService,
                private messagingService: MessageService,
                private timecheckService: TimecheckService) {
        this.subscription = this.layoutService.configUpdate$.subscribe(() => {
            this.initChart();
        });
    }

    ngOnInit() {

        this.USERID = this.authService.getUserId();
        this.getActiveTimecheckCountByUserId();

        this.initChart();
        // this.productService.getProductsSmall().then(data => this.products = data);

        this.items = [
            { label: 'Add New', icon: 'pi pi-fw pi-plus' },
            { label: 'Remove', icon: 'pi pi-fw pi-minus' }
        ];
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.chartData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [
                {
                    label: 'First Dataset',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    fill: false,
                    backgroundColor: documentStyle.getPropertyValue('--bluegray-700'),
                    borderColor: documentStyle.getPropertyValue('--bluegray-700'),
                    tension: .4
                },
                {
                    label: 'Second Dataset',
                    data: [28, 48, 40, 19, 86, 27, 90],
                    fill: false,
                    backgroundColor: documentStyle.getPropertyValue('--green-600'),
                    borderColor: documentStyle.getPropertyValue('--green-600'),
                    tension: .4
                }
            ]
        };

        this.chartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        };
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    getActiveTimecheckCountByUserId() {
        return new Promise((resolve, reject) => {
          this.timecheckService.getActiveTimecheckCountByUserId().subscribe(
            (data: any) => {
              this.activeTimechecks = data.activeTimechecksCount;
              this.activeCourses = data.activeCourseCount;
              resolve(true);
            },
            (error) => {
              console.error('Error getting getTimechecksByUserId:', error);
              reject(true);
            }
          );
        })
      }


      setTimechecksInactive() {
        const userConfirmed = window.confirm("You will no longer be notified for tee times until you setup new ones")
        if (!userConfirmed) return;
        // console.log(this.USERID);
        this.timecheckService.resetTimechecks().subscribe(
            (data: any) => {
              this.activeTimechecks = 0;
              this.messagingService.add({severity: 'success', detail: 'Tee Times Updated', life: 2000})
            },
            (error) => {
              console.error('Error getting getTimechecksByUserId:', error);
            }
          );
      }

}
