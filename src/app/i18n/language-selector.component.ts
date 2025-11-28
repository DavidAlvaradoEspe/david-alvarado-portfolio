import { Component, ElementRef, HostListener } from '@angular/core';
import { I18nService } from './i18n.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
  standalone: true,
})
export class LanguageSelectorComponent {
  isDropdownOpen = false;

  constructor(
    private readonly _i18nService: I18nService,
    private readonly _eRef: ElementRef,
  ) {}

  get currentLanguage(): string {
    const language = this._i18nService.language;
    const parts = language.split('-');
    return parts.length > 1 ? parts[1] : language;
  }

  get languages(): string[] {
    return this._i18nService.supportedLanguages;
  }

  /**
   * Listener to handle click events outside of the dropdown component.
   * Helps in closing the dropdown if clicked outside.
   */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this._eRef?.nativeElement?.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  setLanguage(language: string) {
    this._i18nService.language = language;
    this.isDropdownOpen = false;
  }

  getLanguageCode(language: string): string {
    if (!language) return '';
    const parts = language.split('-');
    return parts.length > 1 ? parts[1].toUpperCase() : language.toUpperCase();
  }
}
