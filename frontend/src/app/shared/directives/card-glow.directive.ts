import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appCardGlow]',
  standalone: true
})
export class CardGlowDirective {
  @Input() glowColor = 'rgba(79, 70, 229, 0.15)'; // Default to indigo glow

  constructor(private el: ElementRef<HTMLElement>) {
    this.el.nativeElement.classList.add('interactive-glow');
    this.el.nativeElement.style.setProperty('--glow-color', this.glowColor);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.el.nativeElement.style.setProperty('--x', `${x}px`);
    this.el.nativeElement.style.setProperty('--y', `${y}px`);
  }
}
