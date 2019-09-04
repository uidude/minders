/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';

import {AddMinderComponent} from './add-minder/add-minder.component';
import {AppComponent} from './app.component';
import {MinderpadNavComponent} from './common-ui/minderpad-nav.component';
import {ActionButtonDirective} from './common/action-button';
import {AppContext} from './common/app-context';
import {FetchCache, RequestCache} from './common/caches';
import {Cookies} from './common/cookies';
import {DataService} from './common/data-service';
import {Debugger} from './common/debugger';
import {DialogButtonDirective} from './common/dialog-button';
import {Mutator} from './common/mutator';
import {NavController} from './common/nav-controller';
import {Voice} from './common/voice';
import {HelpButtonComponent} from './help/help-button.component';
import {LegendComponent} from './help/legend.component';
import {WelcomeComponent} from './help/welcome.component';
import {AddMinderListComponent} from './minder-lists/add-minder-list-component';
import {MinderListsComponent} from './minder-lists/minder-lists.component';
import {MinderViewComponent} from './minder-view/minder-view.component';
import {MinderComponent} from './minder/minder.component';
import {MinderbotComponent} from './minderbot/minderbot.component';
import {SplashComponent} from './splash/splash.component';

const ROUTES = [
  {path: '', redirectTo: 'splash', pathMatch: 'full'},
  {path: 'view', component: MinderViewComponent},
  {path: 'lists', component: MinderListsComponent},
  {path: 'minder', component: MinderComponent},
  {path: 'add', component: AddMinderComponent},
  {path: 'splash', component: SplashComponent},
  {path: 'welcome', component: WelcomeComponent},
  {path: 'minderbot', component: MinderbotComponent},
];

@NgModule({
  declarations: [
    AppComponent, MinderViewComponent, MinderComponent, AddMinderComponent,
    ActionButtonDirective, DialogButtonDirective, MinderListsComponent,
    SplashComponent, LegendComponent, HelpButtonComponent, WelcomeComponent,
    AddMinderListComponent, MinderpadNavComponent, MinderbotComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(ROUTES),
  ],
  providers: [
    NavController, DataService, RequestCache, FetchCache, Debugger, AppContext,
    Mutator, Voice, Cookies
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
