import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { I18nService } from '@app/i18n';
import { CV_DATA, CVSection } from './data';
import { CV_DATA_ES } from './dataEs';

@Injectable({
  providedIn: 'root'
})
export class DataProviderService {
  private _currentData$ = new BehaviorSubject<CVSection[]>(CV_DATA);
  public readonly currentData$ = this._currentData$.asObservable();

  constructor(private i18nService: I18nService) {
    this.updateDataBasedOnLanguage();

    // Subscribe to language changes to update data
    this.i18nService.languageObservable.subscribe(() => {
      this.updateDataBasedOnLanguage();
    });
  }

  /**
   * Get CV data based on current language
   * @returns CVSection array with data in the appropriate language
   */
  getCVData(): CVSection[] {
    const currentLang = this.i18nService.language;
    return this.getDataForLanguage(currentLang);
  }

  /**
   * Get data for a specific language
   * @param language Language code (e.g., 'en-US', 'es-ES')
   * @returns CVSection array for the specified language
   */
  getDataForLanguage(language: string): CVSection[] {
    if (language?.startsWith('es')) {
      return CV_DATA_ES;
    }
    return CV_DATA; // Default to English
  }

  /**
   * Update the current data observable based on the current language
   * @private
   */
  private updateDataBasedOnLanguage(): void {
    const newData = this.getCVData();
    this._currentData$.next(newData);
  }
}
