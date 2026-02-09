import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '@app/i18n/i18n.service';
import {environment} from '@env/environment';
import {TranslateDirective} from '@ngx-translate/core';

@Component({
  selector: 'app-language-select',
  templateUrl: './language-select.component.html',
  styleUrls: ['./language-select.component.scss'],
  standalone: true,
  imports: [TranslateDirective],
})
export class LanguageSelectComponent implements OnInit {
  selectedLanguage: string = environment.defaultLanguage;

  languages = [
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' }
  ];

  constructor(
    private i18nService: I18nService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initialize with default language if no language is set
    const currentLang = this.i18nService.language || environment.defaultLanguage;
    this.selectedLanguage = currentLang;

    // Ensure the language is set
    if (!this.i18nService.language) {
      this.i18nService.language = currentLang;
    }
  }

  selectLanguage(langCode: string) {
    this.selectedLanguage = langCode;
    // Update language immediately to see the changes
    this.i18nService.language = langCode;
    // Force change detection to update the UI immediately
    this.cdr.detectChanges();
  }

  confirmAndNavigate() {
    // Navigate to map puzzle (language is already set in selectLanguage)
    this.router.navigate(['/map-puzzle']);
  }
}

