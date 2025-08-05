import { Component, OnInit } from '@angular/core';
import { TeeSheetService } from '../../service/teesheet.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-teesheet',
  templateUrl: './teesheet.component.html',
  styleUrls: ['./teesheet.component.scss']
})
export class TeesheetComponent implements OnInit {

  teeSheet = [];
  teeTimeDialog: boolean = false;
  selectedTeeSheetId: number;

  constructor(private teesheetService: TeeSheetService) {}

  ngOnInit(): void {
      this.getTeeSheet();
  }

  async getTeeSheet() {
    this.teeSheet = await firstValueFrom(this.teesheetService.getTeeTimes());
    console.log(this.teeSheet);
  }
}
