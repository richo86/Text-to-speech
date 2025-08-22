import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { Signup } from './auth/signup/signup.component';
import { authGuard } from './auth/auth.guard';
import { MainViewComponent } from './main-view/main-view.component';

export const routes: Routes = [
    { path: '', component: LoginComponent, pathMatch: 'full' },
    { path: 'signup', component: Signup },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'main' },
            { path: 'main', component: MainViewComponent }
        ]
    },
    { path: '**', redirectTo: '' }
];
