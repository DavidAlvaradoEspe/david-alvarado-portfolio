import { Injectable } from '@angular/core';
import {BehaviorSubject, concatMap, delay, of, Subject, tap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SplashScreenService {
  private _show$ = new BehaviorSubject<boolean>(false);
  public readonly show$ = this._show$.asObservable();

  private _message$ = new BehaviorSubject<string>('Engaging Mechanism');
  public readonly message$ = this._message$.asObservable();

  private _image$ = new BehaviorSubject<string>('assets/icons/map-icon.png');
  public readonly image$ = this._image$.asObservable();

  private _showButton$ = new BehaviorSubject<boolean>(false);
  public readonly showButton$ = this._showButton$.asObservable();

  public buttonText = 'LAUNCH';

  public isTransparent = false;
  public autoHide = true;

  // 2. Control opacity
  private _textVisible$ = new BehaviorSubject<boolean>(true);
  public readonly textVisible$ = this._textVisible$.asObservable();

  private _messageRequest$ = new Subject<string>();

  constructor() {
    this._messageRequest$.pipe(
      concatMap(msg => {
        this._textVisible$.next(false);
        return of(msg).pipe(
          delay(300),
          tap(newMsg => {
            this._message$.next(newMsg);
            this._textVisible$.next(true);
          }),
          delay(1000)
        );
      })
    ).subscribe();
  }

  public updateMessage(msg: string): void {
    this._messageRequest$.next(msg);
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
      this.updateMessage('Coordinates Locked');
    }
  }

  public forceClose(): void {
    this.show = false;
  }

  private toggleScroll(disable: boolean) {
    if (disable) document.body.classList.add('no-scroll');
    else document.body.classList.remove('no-scroll');
  }

  public updateImage(src: string) {
    this._image$.next(src);
  }
}
