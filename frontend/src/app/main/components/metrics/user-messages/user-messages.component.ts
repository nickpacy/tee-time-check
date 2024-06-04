import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MetricService } from 'src/app/main/service/metric.service';

@Component({
  selector: 'app-user-messages',
  templateUrl: './user-messages.component.html',
  styleUrls: ['./user-messages.component.scss']
})
export class UserMessagesComponent implements OnInit {

  monthlyCharges: any[] = [];
  cols: any[] = [];
  totalRow: any = { month: 'Total' };
  totalColumn: any = {};

  constructor(private metricService: MetricService) { }

  ngOnInit(): void {
      this.getAllUsersMonthlyCharges();
  }

  async getAllUsersMonthlyCharges() {
    this.monthlyCharges = await firstValueFrom(this.metricService.getAllUsersMonthlyCharges());
    
    if (this.monthlyCharges.length > 0) {
      this.cols = Object.keys(this.monthlyCharges[0]).map(key => {
        return { field: key, header: key.charAt(0).toUpperCase() + key.slice(1) };
      });

      // Initialize totalRow with 0s
      this.cols.forEach(col => {
        if (col.field !== 'month') {
          this.totalRow[col.field] = 0;
          this.totalColumn[col.field] = 0;
        }
      });

      // Calculate totals for each column and total per row
      this.monthlyCharges.forEach(row => {
        let rowTotal = 0;
        Object.keys(row).forEach(key => {
          if (key !== 'month') {
            const value = parseFloat(row[key]);
            this.totalRow[key] += value;
            rowTotal += value;
          }
        });
        row['total'] = rowTotal;  // Add total per row
      });

      // Calculate total for each column
      Object.keys(this.totalRow).forEach(key => {
        if (key !== 'month') {
          this.totalRow.total = (this.totalRow.total || 0) + this.totalRow[key];
        }
      });
    }
  }
}
