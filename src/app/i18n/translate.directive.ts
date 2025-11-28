import {
  AfterViewChecked,
  ChangeDetectorRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

interface ExtendedNode extends Text {
  originalContent?: string;
  currentValue?: any;
  lookupKey?: string;
  lastKey?: string | null;
}

type InterpolationParameters = Record<string, any>;

@Directive({
  selector: '[translate],[ngx-translate]',
  standalone: true
})
export class TranslateDirective implements AfterViewChecked, OnDestroy {
  key!: string;
  lastParams?: InterpolationParameters;
  currentParams?: InterpolationParameters;

  onLangChangeSub!: Subscription;
  onDefaultLangChangeSub!: Subscription;
  onTranslationChangeSub!: Subscription;

  @Input()
  set translate(key: string) {
    if (key) {
      this.key = key;
      this.checkNodes();
    }
  }

  @Input()
  set translateParams(params: InterpolationParameters) {
    if (params && !this.areParamsEqual(this.currentParams, params)) {
      this.currentParams = params;
      this.checkNodes(true);
    }
  }

  constructor(
    private translateService: TranslateService,
    private element: ElementRef,
    private _ref: ChangeDetectorRef
  ) {
    // Subscribe to onLangChange event
    this.onLangChangeSub = this.translateService.onLangChange.subscribe(() => {
      // Reset all nodes to force re-translation
      const nodes: NodeList = this.element.nativeElement.childNodes;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as ExtendedNode;
        if (node.nodeType === Node.TEXT_NODE) {
          node.lastKey = null;
          node.currentValue = undefined;
        }
      }
      this.checkNodes(true);
    });

    // Subscribe to onDefaultLangChange event
    this.onDefaultLangChangeSub = this.translateService.onDefaultLangChange.subscribe(() => {
      const nodes: NodeList = this.element.nativeElement.childNodes;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as ExtendedNode;
        if (node.nodeType === Node.TEXT_NODE) {
          node.lastKey = null;
          node.currentValue = undefined;
        }
      }
      this.checkNodes(true);
    });

    // Subscribe to onTranslationChange event
    this.onTranslationChangeSub = this.translateService.onTranslationChange.subscribe(() => {
      const nodes: NodeList = this.element.nativeElement.childNodes;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as ExtendedNode;
        if (node.nodeType === Node.TEXT_NODE) {
          node.lastKey = null;
          node.currentValue = undefined;
        }
      }
      this.checkNodes(true);
    });
  }

  ngAfterViewChecked(): void {
    this.checkNodes();
  }

  checkNodes(forceUpdate: boolean = false): void {
    const nodes: NodeList = this.element.nativeElement.childNodes;

    // If the element is empty, use the key as content
    if (!nodes.length) {
      if (this.key) {
        this.setContent(this.element.nativeElement, this.key);
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i] as ExtendedNode;

      if (node.nodeType === Node.TEXT_NODE) {
        let key: string;

        if (forceUpdate) {
          node.lastKey = null;
        }

        if (this.key) {
          key = this.key;
        } else {
          const content = this.getContent(node);
          const trimmedContent = content.trim();

          if (trimmedContent.length) {
            // Store the original content
            if (!node.originalContent) {
              node.originalContent = content;
            }
            key = trimmedContent;
          } else {
            continue;
          }
        }

        this.updateValue(key, node);
      }
    }
  }

  updateValue(key: string, node: ExtendedNode): void {
    // Check if we need to update due to parameter changes
    const shouldUpdateDueToParams = key === node.lastKey && !this.areParamsEqual(this.lastParams, this.currentParams);

    // Check if we need to update (different key, no previous key, or params changed)
    const shouldUpdate = key !== node.lastKey || node.lastKey === null || shouldUpdateDueToParams;

    if (shouldUpdate) {
      node.lastKey = key;
      this.lastParams = this.currentParams;

      const onTranslation = (res: string) => {
        // Always update if the value changed
        if (res !== node.currentValue) {
          node.currentValue = res;
          this.setContent(node, res);
          this._ref.markForCheck();
        }
      };

      // Always use the get method for simplicity and compatibility
      this.translateService.get(key, this.currentParams).subscribe({
        next: onTranslation,
        error: () => {
          // Fallback to the key if translation fails
          onTranslation(key);
        }
      });
    }
  }

  getContent(node: ExtendedNode): string {
    return node.textContent || '';
  }

  setContent(node: any, content: string): void {
    if (node.textContent !== undefined) {
      node.textContent = content;
    } else {
      node.data = content;
    }
  }

  ngOnDestroy(): void {
    if (this.onLangChangeSub) {
      this.onLangChangeSub.unsubscribe();
    }
    if (this.onDefaultLangChangeSub) {
      this.onDefaultLangChangeSub.unsubscribe();
    }
    if (this.onTranslationChangeSub) {
      this.onTranslationChangeSub.unsubscribe();
    }
  }

  private areParamsEqual(params1?: InterpolationParameters, params2?: InterpolationParameters): boolean {
    if (params1 === params2) {
      return true;
    }

    if (!params1 || !params2) {
      return false;
    }

    const keys1 = Object.keys(params1);
    const keys2 = Object.keys(params2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (params1[key] !== params2[key]) {
        return false;
      }
    }

    return true;
  }
}

