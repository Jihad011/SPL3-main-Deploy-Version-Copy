import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="skeleton-loader" 
      [style.width]="width" 
      [style.height]="height" 
      [style.border-radius]="borderRadius"
      [class.circle]="type === 'circle'"
      [class.rect]="type === 'rect'">
    </div>
  `,
  styles: [`
    .skeleton-loader {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.03) 25%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.03) 75%
      );
      background-size: 200% 100%;
      animation: loading 1.5s infinite linear;
    }
    .rect {
      border-radius: 8px;
    }
    .circle {
      border-radius: 50%;
    }
    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() width: string = '100%';
  @Input() height: string = '20px';
  @Input() borderRadius: string = '8px';
  @Input() type: 'rect' | 'circle' = 'rect';
}
