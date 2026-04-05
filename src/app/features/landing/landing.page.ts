import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingComponent } from './landing.component';

@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LandingComponent],
  template: ` <app-landing /> `,
})
export class LandingPage {}

