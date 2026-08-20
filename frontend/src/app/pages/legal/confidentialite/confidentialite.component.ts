import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-confidentialite',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confidentialite.component.html',
})
export class ConfidentialiteComponent {}
