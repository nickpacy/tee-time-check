import { Component, ViewChild } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent {
  @ViewChild('calendar') calendarComponent: FullCalendarComponent;

  calendarOptions: CalendarOptions = {
    plugins: [resourceTimeGridPlugin],
    initialView: 'resourceTimeGridDay', // Use resourceDayGridDay
    slotMinTime: '06:00:00', // Adjust the start time
    slotMaxTime: '18:00:00', // Adjust the end time
    slotDuration: '00:10:00',
    resources: [
      { id: 'a', title: 'Room A' },
      { id: 'b', title: 'Room B' },
    ],
    events: [
      // Events with resourceId for resource association
      { title: 'Event 1', resourceId: 'a', start: '2023-08-15T10:00:00', end: '2023-08-15T12:00:00' },
      { title: 'Event 2', resourceId: 'b', start: '2023-08-15T14:00:00', end: '2023-08-15T16:00:00' },
    ],
  }

}
