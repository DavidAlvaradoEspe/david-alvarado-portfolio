import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { I18nService } from './i18n';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SplashScreenComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 't-p-portfolio';

  constructor(private i18nService: I18nService) {}

  ngOnInit() {
    // Initialize i18n with supported languages
    this.i18nService.init('en-US', ['en-US', 'es-ES']);
  }

  ngOnDestroy() {
    this.i18nService.destroy();
  }
}

