import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SplashScreenService {
  private _show$ = new BehaviorSubject<boolean>(false);
  public readonly show$ = this._show$.asObservable();

  private _message$ = new BehaviorSubject<string>('Loading...');
  public readonly message$ = this._message$.asObservable();

  public isTransparent = false;

  get show(): boolean {
    return this._show$.value;
  }
  set show(v: boolean) {
    this._show$.next(v);
    if (v) this.toggleScroll(true);
    else this.toggleScroll(false);
  }


  public updateMessage(msg: string): void {
    this._message$.next(msg);
  }

  public hide(): void {
    this.show = false;
  }

  private toggleScroll(disable: boolean) {
    if (disable) document.body.classList.add('no-scroll');
    else document.body.classList.remove('no-scroll');
  }
}
