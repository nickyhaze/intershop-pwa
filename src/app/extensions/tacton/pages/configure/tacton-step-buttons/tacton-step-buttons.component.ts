import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TactonFacade } from '../../../facades/tacton.facade';

@Component({
  selector: 'ish-tacton-step-buttons',
  templateUrl: './tacton-step-buttons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TactonStepButtonsComponent {
  constructor(private tactonFacade: TactonFacade) {}

  reset() {
    this.tactonFacade.resetConfiguration();
  }
}
