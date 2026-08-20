import { Component, ElementRef, output, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  templateUrl: './signature-pad.component.html',
})
export class SignaturePadComponent {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly hasSignature = signal(false);
  readonly signatureChange = output<string | null>();

  private drawing = false;
  private lastX = 0;
  private lastY = 0;

  private ctx(): CanvasRenderingContext2D {
    const ctx = this.canvasRef().nativeElement.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }
    return ctx;
  }

  private point(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    this.drawing = true;
    const { x, y } = this.point(event);
    this.lastX = x;
    this.lastY = y;
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.drawing) {
      return;
    }
    event.preventDefault();
    const { x, y } = this.point(event);
    const ctx = this.ctx();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    this.lastX = x;
    this.lastY = y;
    this.hasSignature.set(true);
  }

  onPointerUp(): void {
    if (!this.drawing) {
      return;
    }
    this.drawing = false;
    this.emitChange();
  }

  clear(): void {
    const canvas = this.canvasRef().nativeElement;
    this.ctx().clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature.set(false);
    this.signatureChange.emit(null);
  }

  private emitChange(): void {
    this.signatureChange.emit(this.canvasRef().nativeElement.toDataURL('image/png'));
  }
}
