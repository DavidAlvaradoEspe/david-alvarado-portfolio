import { Injectable } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import enUS from '../translations/en-US.json';
import esES from '../translations/es-ES.json';
import { Logger } from '@app/@core/services';
import { environment } from '@env/environment';

const log = new Logger('I18nService');
const languageKey = 'language';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  defaultLanguage!: string;
  supportedLanguages!: string[];
  reloadOnLanguageChange: boolean = false; // New property for reload functionality

  private _langChangeSubscription!: Subscription;
  private readonly _languageSubject: BehaviorSubject<string>;

  constructor(private readonly _translateService: TranslateService) {
    // Initialize the BehaviorSubject with an initial value
    this._languageSubject = new BehaviorSubject<string>(localStorage.getItem(languageKey) || environment.defaultLanguage || this._translateService.getBrowserCultureLang() || '');

    // Embed languages to avoid extra HTTP requests
    _translateService.setTranslation('es-ES', esES);
    _translateService.setTranslation('en-US', enUS);
  }

  /**
   * Returns the current language as an observable.
   * @return Observable of the current language.
   */
  get languageObservable(): Observable<string> {
    return this._languageSubject.asObservable();
  }

  /**
   * Gets the current language.
   * @return The current language code.
   */
  get language(): string {
    return this._translateService.currentLang;
  }

  /**
   * Sets the current language.
   * Note: The current language is saved to the local storage.
   * If no parameter is specified, the language is loaded from local storage (if present).
   * @param language The IETF language code to set.
   */
  set language(language: string) {
    let newLanguage = language || localStorage.getItem(languageKey) || environment.defaultLanguage || this._translateService.getBrowserCultureLang() || '';
    let isSupportedLanguage = this.supportedLanguages?.includes(newLanguage) || false;

    // If no exact match is found, search without the region
    if (newLanguage && !isSupportedLanguage) {
      const langWithoutRegion = newLanguage.split('-')[0];
      const foundLanguage = this.supportedLanguages?.find((supportedLanguage) =>
        supportedLanguage.startsWith(langWithoutRegion)
      );
      if (foundLanguage) {
        newLanguage = foundLanguage;
        isSupportedLanguage = true;
      }
    }

    // Fallback if language is not supported
    if (!newLanguage || !isSupportedLanguage) {
      newLanguage = this.defaultLanguage;
    }

    // Update the subject if language changed
    if (newLanguage !== this._languageSubject.value) {
      this._languageSubject.next(newLanguage);
    }

    log.debug(`Language set to ${newLanguage}`);
    this._translateService.use(newLanguage);
  }

  /**
   * Initializes i18n for the application.
   * Loads language from local storage if present, or sets default language.
   * @param defaultLanguage The default language to use.
   * @param supportedLanguages The list of supported languages.
   */
  init(defaultLanguage: string, supportedLanguages: string[]) {
    this.defaultLanguage = defaultLanguage;
    this.supportedLanguages = supportedLanguages;
    log.debug(`Initializing with default language: ${defaultLanguage}`);
    this.language = '';

    // Warning: this subscription will always be alive for the app's lifetime
    this._langChangeSubscription = this._translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      localStorage.setItem(languageKey, event.lang);

      if (this.reloadOnLanguageChange) {
        window.location.reload();
      }
    });
  }

  /**
   * Enable automatic page reload when language changes.
   * Useful for components with complex data structures that need full reinitialization.
   */
  enableReloadOnLanguageChange(): void {
    this.reloadOnLanguageChange = true;
  }

  /**
   * Disable automatic page reload when language changes.
   * Returns to normal behavior where only observables are updated.
   */
  disableReloadOnLanguageChange(): void {
    this.reloadOnLanguageChange = false;
  }

  /**
   * Cleans up language change subscription.
   */
  destroy() {
    if (this._langChangeSubscription) {
      this._langChangeSubscription.unsubscribe();
    }
  }
}
