import { Component, ViewEncapsulation } from '@angular/core';
import {CommonModule} from '@angular/common';
import { SplashScreenService } from './splash-screen-service';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None
})
export class SplashScreenComponent {
  constructor(public splashService: SplashScreenService) {}
}
