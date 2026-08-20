import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mentions-legales',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mentions-legales.component.html',
})
export class MentionsLegalesComponent {}
