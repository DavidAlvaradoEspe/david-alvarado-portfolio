import { Component, ViewEncapsulation } from '@angular/core';
import {CommonModule} from '@angular/common';
import { SplashScreenService } from './splash-screen-service';

@Component({
  selector: 'td-workspace-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None // Allows styles to penetrate if needed, optional
})
export class SplashScreenComponent {
  // We use the service observables directly in the HTML with the async pipe
  constructor(public splashService: SplashScreenService) {}
}
