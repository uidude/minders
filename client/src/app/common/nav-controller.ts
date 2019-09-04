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
import {Injectable, Type} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, NavigationEnd, NavigationExtras, NavigationStart, ParamMap, Router, UrlSegmentGroup, UrlSerializer, UrlTree} from '@angular/router';

import {MinderApi, MinderList} from '../minder-api/minder-service';

import {AppContext} from './app-context';
import {ComponentLifecycle, isComponentLifecycle} from './component-lifecycle';
import {Cookies} from './cookies';
import {DataService} from './data-service';

/**
 * Params for navigation
 */
export class Nav {
  /** Constant to navigate back tot the previous page **/
  public static BACK: string = 'BACK';

  /** Path to navigate to, e.g. '/list' **/
  path?: string;

  /** Params to pass to navigation **/
  params?: {[key: string]: string};

  /** Navigation extras for use with Router navigate() API **/
  extras?: {[key: string]: any};

  /** Message to show to user **/
  msg?: string;

  /** Whether an error occurred **/
  isError?: boolean;
}


@Injectable()
export class NavController {
  listId!: string|null;
  viewId!: string|null;
  minderList!: MinderList;
  scrollTo!: number;
  first!: boolean;
  component: any;
  upPath?: string;
  upParams?: any;
  isMobile: boolean;
  isWebApp: boolean;
  private lastAuth: Date;
  navState: number = 1;
  navStyle!: String;

  public static BACK: string = 'BACK';
  public static NONAV: string = 'NONAV';

  constructor(
      private router: Router, private appContext: AppContext,
      private data: DataService, private http: HttpClient,
      private urlSerializer: UrlSerializer, private cookies: Cookies) {
    window.addEventListener('focus', event => this.onFocus(event));
    window.addEventListener('popstate', event => this.onPopState(event));
    var mywin = window as any;
    mywin['mysc'] = cookies.setCookie;
    mywin['mygc'] = cookies.getCookie;
    this.isMobile = /Mobi/.test(navigator.userAgent);
    this.isWebApp = window.matchMedia('(display-mode: standalone)').matches;

    // Assume we just authorized when we are first constructed
    this.lastAuth = new Date();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.closeNavigationDrawerIfOpen();
        this.closeAllMenus();
      }
      if (event instanceof NavigationEnd) {
        let params = this.getParamsFromRouter();
        if (params) {
          this.listId = params.get('list');
          this.viewId = params.get('view');
          this.first = Boolean(params.get('first'));
          appContext.debug = params.get('debug') ? Boolean(params.get('debug')) : false;
          if (this.listId) {
            cookies.setCookie('lastPad', this.listId, 1000 * 3600 * 24 * 7);
          }
        }
        this.possiblyReauth();
      }
      this.data.req(MinderApi.GET_MINDER_LISTS, {}).then(resp => {
        let minderLists = resp.lists;
        for (let i = 0; i < minderLists.length; i++) {
          if (minderLists[i].id == this.listId) {
            this.minderList = minderLists[i];
          }
        }
      });
    });

  }

  getParamsFromRouter(): ParamMap|null {
    if (this.router.routerState.root && this.router.routerState.root.firstChild) {
      return this.router.routerState.root.firstChild.snapshot.paramMap;
    }
    return null;
  }

  initNav(
      selector: string, navStyle: string, manifest?: string, upPath?: string,
      upParams?: any) {
    let manifestUrl = manifest || '/manifest.json';
    setTimeout(() => {
      $('#manifest').attr('href', manifestUrl);
      this.setNav(selector);
      this.setStyle(navStyle);
      this.upPath = upPath;
      this.upParams = upParams;
      this.upgradeDom();
    }, 0)
  }

  writeHeaderElementsFromTemplate(
      template: any, className: string, elementType: string): boolean {
    let oldEls = $('.mdl-layout__header').find('.' + className);
    let newEls = template.find('.' + className); // Used to be .clone(), not needed now?
    let hasElements = newEls.length != 0;
    if (!hasElements) {
      newEls = jQuery(elementType).addClass(className + ' hidden-nav-template');
    }
    newEls.insertBefore(oldEls.first());
    oldEls.remove();
    return hasElements;
  };

  setNav(selector: String): void {
    let parent = $(selector);
    this.writeHeaderElementsFromTemplate(parent, 'nav-title', '<div>');
    this.writeHeaderElementsFromTemplate(parent, 'nav-icon', '<div>');

    let hasItems = this.writeHeaderElementsFromTemplate(parent, 'nav-menu-item', '<li>');
    $('#more-items-menu').toggle(hasItems);
  };

  setStyle(style: String): void {
    this.navStyle = style;
    switch (style) {
      case 'drawer':
        $('#up-button').css('display', 'none');
        $('#menu-button').css('display', 'inline-block');
        $('.mdl-layout__header-row').css('paddingLeft', '');
        $('.mdl-layout__drawer-button').css('display', 'block');
        break;
      case 'up':
        $('#up-button').css('display', 'inline-block');
        $('#menu-button').css('display', 'none');
        $('.mdl-layout__header-row').css('paddingLeft', '');
        $('.mdl-layout__drawer-button').css('display', 'block');
        break;
      case 'none':
        $('#up-button').css('display', 'none');
        $('#menu-button').css('display', 'none');
        $('.mdl-layout__header-row').css('cssText', 'padding-left:16px !important');
        $('.mdl-layout__drawer-button').css('display', 'none');
        break;

    }
  }

  closeAllMenus() {
    $('.mdl-js-menu').each((index, value) => {
      let element: any = value;
      if (element.MaterialMenu) {
        element.MaterialMenu.hide();
      }
    });
  }

  closeNavigationDrawerIfOpen() {
    let layout: any = document.getElementsByClassName('mdl-js-layout')[0];
    let drawer = document.getElementsByClassName('mdl-layout__drawer')[0];
    if (layout && drawer && drawer.classList.contains('is-visible')) {
      layout.MaterialLayout.toggleDrawer();
    }
  }

  navigateToUrl(url: string, target?: string) {
    this.closeNavigationDrawerIfOpen();
    this.closeAllMenus();
    window.open(url, target);
  }

  navigate(path: string, params?: any, extras?: NavigationExtras) {
    this.closeNavigationDrawerIfOpen();
    this.closeAllMenus();

    // Store scroll state
    window.history.replaceState({scrollTo: window.scrollY}, document.title, window.location.pathname);

    params = params || {};
    if (this.listId && !params['list']) {
      params['list'] = this.listId;
    }
    if (this.viewId && !params['view']) {
      params['view'] = this.viewId;
    }
    if (this.appContext.debug) {
      params['debug'] = 'true';
    }
    let route = [path];
    if (!(path == '/')) {
      route.push(params);
    }
    var segments = new UrlSegmentGroup([], {});
    var tree = this.router.createUrlTree(route);
    if (this.urlSerializer.serialize(tree) == this.router.url) {
      if (isComponentLifecycle(this.component)) {
        var lifecycle = this.component as ComponentLifecycle;
        lifecycle.reload();
      }
    } else {
      this.navState++;
      this.router.navigate(route, extras);
    }
  }

  to(nav: Nav, onlyNavIfStateIs?: Number) {
    if (nav.msg) {
      this.snack(nav.msg, nav.isError);
    }

    if (!onlyNavIfStateIs || (onlyNavIfStateIs == this.navState)) {
      if (nav.path == Nav.BACK) {
        window.history.back();
      } else if (nav.path) {
        this.navigate(nav.path, nav.params, nav.extras)
      }
    }
  }

  navigateWithMessage(
      path: string, message: string, params?: any, isError?: boolean) {
    if (path == NavController.NONAV) {
      this.snack(message, isError);
    } else if (path == NavController.BACK) {
      this.backWithMessage(message, isError);
    } else {
      this.snack(message, isError);
      this.navigate(path, params);
    }
  }

  backWithMessage(message: string, isError?: boolean) {
    this.snack(message, isError);
    window.history.back();
  }

  snack(message: string, isError?: boolean) {
    let snackId = isError ? '#error-snacking' : '#snacking';
    let snacky: any = $(snackId).get()[0];
    if (snacky.MaterialSnackbar) {
      snacky.MaterialSnackbar.showSnackbar({timeout: 3000, message: message});
    }
  }

  setSpinnerVisible(visible: boolean) {
    if (visible) {
      $('#spinner').addClass('is-active');
    } else {
      $('#spinner').removeClass('is-active');
    }
  }

  possiblyReauth() {
    let elapsed = new Date().getTime() - this.lastAuth.getTime();

    // If > 15 minutes, try to reauth
    if (elapsed > (1000 * 60 * 15)) {
      let iframe = document.createElement('iframe');
      iframe.style.visibility = 'hidden';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.src = '/assets/auth-refresh.html';
      document.body.appendChild(iframe);
      this.lastAuth = new Date();
      window.setTimeout(() => document.body.removeChild(iframe), 5000);
    }
  }

  onFocus(event:any) {
    this.possiblyReauth();
  }

  onPopState(event:any) {
    if (event.state && event.state.scrollTo) {
      this.scrollTo = event.state.scrollTo;
    }
  }

  navigateUp() {
    if (this.navStyle == 'up') {
      this.navState++;
      if (this.upPath) {
        this.navigate(this.upPath, this.upParams);
      } else {
        window.history.back();
      }
    }
  }

  upgradeDom() {
    // After navigation, upgrade all of the material UI
    let windowProperties: any = window;
    if (windowProperties['componentHandler']) {
      windowProperties['componentHandler']['upgradeDom']();
    }
  }
}
