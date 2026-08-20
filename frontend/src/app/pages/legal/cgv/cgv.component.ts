import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cgv',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cgv.component.html',
})
export class CgvComponent {}
