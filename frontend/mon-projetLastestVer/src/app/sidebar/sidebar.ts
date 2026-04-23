import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  standalone: false
})
export class Sidebar {
  
  constructor(private router: Router) {}

  logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      this.router.navigate(['/home']);
    }
  }
}