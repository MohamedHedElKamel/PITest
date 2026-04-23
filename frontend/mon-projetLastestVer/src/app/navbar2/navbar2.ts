import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar2',
  standalone: false,
  templateUrl: './navbar2.html',
  styleUrl: './navbar2.css',
})
export class Navbar2 {

  showMobileMenu: boolean = false;

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  
}

