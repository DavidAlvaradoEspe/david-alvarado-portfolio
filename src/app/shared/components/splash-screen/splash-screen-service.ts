import { Injectable } from '@angular/core';
import {BehaviorSubject, concatMap, delay, of, Subject, tap} from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class SplashScreenService {
  private _show$ = new BehaviorSubject<boolean>(false);
  public readonly show$ = this._show$.asObservable();

  private _message$ = new BehaviorSubject<string>('');
  public readonly message$ = this._message$.asObservable();

  private _image$ = new BehaviorSubject<string>('assets/icons/map-icon.png');
  public readonly image$ = this._image$.asObservable();

  private _showButton$ = new BehaviorSubject<boolean>(false);
  public readonly showButton$ = this._showButton$.asObservable();

  private _buttonText$ = new BehaviorSubject<string>('');
  public readonly buttonText$ = this._buttonText$.asObservable();

  public get buttonText(): string {
    return this._buttonText$.value;
  }
  public set buttonText(value: string) {
    this.updateButtonText(value);
  }

  public isTransparent = false;
  public autoHide = true;

  private _textVisible$ = new BehaviorSubject<boolean>(true);
  public readonly textVisible$ = this._textVisible$.asObservable();

  private _messageRequest$ = new Subject<string>();

  private _isExiting$ = new BehaviorSubject<boolean>(false);
  public readonly isExiting$ = this._isExiting$.asObservable();



  constructor(private translateService: TranslateService) {
    this.initializeTranslations();

    this.translateService.onLangChange.subscribe(() => {
      this.initializeTranslations();
    });

    this._messageRequest$.pipe(
      concatMap(msg => {
        this._textVisible$.next(false);
        return of(msg).pipe(
          delay(300),
          tap(newMsg => {
            this.translateService.get(newMsg).subscribe(translatedMsg => {
              this._message$.next(translatedMsg);
            });
            this._textVisible$.next(true);
          }),
          delay(500)
        );
      })
    ).subscribe();
  }

  private initializeTranslations(): void {
    this.translateService.get('Engaging Mechanism').subscribe(translation => {
      this._message$.next(translation);
    });

    this.translateService.get('LAUNCH').subscribe(translation => {
      this._buttonText$.next(translation);
    });
  }

  public forceClose() {
    this._isExiting$.next(true);

    setTimeout(() => {
      this.show = false;
      this._isExiting$.next(false); // Reset for next time
    }, 500);
  }

  public updateMessage(msg: string): void {
    this._messageRequest$.next(msg);
  }

  public updateButtonText(text: string): void {
    this.translateService.get(text).subscribe(translation => {
      this._buttonText$.next(translation);
    });
  }

  get show(): boolean {
    return this._show$.value;
  }
  set show(v: boolean) {
    this._show$.next(v);
    if (v) this.toggleScroll(true);
    else this.toggleScroll(false);
  }


  public hide(): void {
    if (this.autoHide) {
      this.show = false;
    } else {
      this._showButton$.next(true);
      this.updateMessage('!COORDINATES LOCKED!');
    }
  }

  private toggleScroll(disable: boolean) {
    if (disable) document.body.classList.add('no-scroll');
    else document.body.classList.remove('no-scroll');
  }

  public updateImage(src: string) {
    this._image$.next(src);
  }
}
