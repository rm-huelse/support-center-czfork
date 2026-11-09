(function () {
  'use strict';

  // Key map
  const ENTER = 13;
  const ESCAPE = 27;

  function toggleNavigation(toggle, menu) {
    const isExpanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", !isExpanded);
    toggle.setAttribute("aria-expanded", !isExpanded);
  }

  function closeNavigation(toggle, menu) {
    menu.setAttribute("aria-expanded", false);
    toggle.setAttribute("aria-expanded", false);
    toggle.focus();
  }

  // Navigation
  window.addEventListener("DOMContentLoaded", () => {
    // Updated selector to match new rm-header structure
    const menuButton = document.querySelector(".nav-wrapper-mobile .menu-button-mobile");
    const menuList = document.querySelector("#user-nav-mobile");

    if (menuButton && menuList) {
      menuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleNavigation(menuButton, menuList);
      });

      menuList.addEventListener("keyup", (event) => {
        if (event.keyCode === ESCAPE) {
          event.stopPropagation();
          closeNavigation(menuButton, menuList);
        }
      });
    }

    // Toggles expanded aria to collapsible elements
    const collapsible = document.querySelectorAll(
      ".collapsible-nav, .collapsible-sidebar"
    );

    collapsible.forEach((element) => {
      const toggle = element.querySelector(
        ".collapsible-nav-toggle, .collapsible-sidebar-toggle"
      );

      element.addEventListener("click", () => {
        toggleNavigation(toggle, element);
      });

      element.addEventListener("keyup", (event) => {
        if (event.keyCode === ESCAPE) {
          closeNavigation(toggle, element);
        }
      });
    });

    // If multibrand search has more than 5 help centers or categories collapse the list
    const multibrandFilterLists = document.querySelectorAll(
      ".multibrand-filter-list"
    );
    multibrandFilterLists.forEach((filter) => {
      if (filter.children.length > 6) {
        const trigger = filter.querySelector(".see-all-filters");
        trigger.setAttribute("aria-hidden", false);

        trigger.addEventListener("click", (event) => {
          event.stopPropagation();
          trigger.parentNode.removeChild(trigger);
          filter.classList.remove("multibrand-filter-list--collapsed");
        });
      }
    });
  });

  const isPrintableChar = (str) => {
    return str.length === 1 && str.match(/^\S$/);
  };

  function Dropdown(toggle, menu) {
    this.toggle = toggle;
    this.menu = menu;

    this.menuPlacement = {
      top: menu.classList.contains("dropdown-menu-top"),
      end: menu.classList.contains("dropdown-menu-end"),
    };

    this.toggle.addEventListener("click", this.clickHandler.bind(this));
    this.toggle.addEventListener("keydown", this.toggleKeyHandler.bind(this));
    this.menu.addEventListener("keydown", this.menuKeyHandler.bind(this));
    document.body.addEventListener("click", this.outsideClickHandler.bind(this));

    const toggleId = this.toggle.getAttribute("id") || crypto.randomUUID();
    const menuId = this.menu.getAttribute("id") || crypto.randomUUID();

    this.toggle.setAttribute("id", toggleId);
    this.menu.setAttribute("id", menuId);

    this.toggle.setAttribute("aria-controls", menuId);
    this.menu.setAttribute("aria-labelledby", toggleId);

    this.menu.setAttribute("tabindex", -1);
    this.menuItems.forEach((menuItem) => {
      menuItem.tabIndex = -1;
    });

    this.focusedIndex = -1;
  }

  Dropdown.prototype = {
    get isExpanded() {
      return this.toggle.getAttribute("aria-expanded") === "true";
    },

    get menuItems() {
      return Array.prototype.slice.call(
        this.menu.querySelectorAll("[role='menuitem'], [role='menuitemradio']")
      );
    },

    dismiss: function () {
      if (!this.isExpanded) return;
      this.toggle.removeAttribute("aria-expanded");
      // Only remove placement classes if they weren't set on initial render
      if (!this.menuPlacement.end) this.menu.classList.remove("dropdown-menu-end");
      if (!this.menuPlacement.top) this.menu.classList.remove("dropdown-menu-top");
      this.focusedIndex = -1;
    },

    open: function () {
      if (this.isExpanded) return;
      this.toggle.setAttribute("aria-expanded", true);
      this.handleOverflow();
    },

    handleOverflow: function () {
      var rect = this.menu.getBoundingClientRect();

      var overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight,
      };

      if (overflow.right || this.menuPlacement.end) {
        this.menu.classList.add("dropdown-menu-end");
      }

      if (overflow.bottom || this.menuPlacement.top) {
        this.menu.classList.add("dropdown-menu-top");
      }

      if (this.menu.getBoundingClientRect().top < 0) {
        this.menu.classList.remove("dropdown-menu-top");
      }
    },

    focusByIndex: function (index) {
      if (!this.menuItems.length) return;

      this.menuItems.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.tabIndex = 0;
          item.focus();
        } else {
          item.tabIndex = -1;
        }
      });

      this.focusedIndex = index;
    },

    focusFirstMenuItem: function () { this.focusByIndex(0); },
    focusLastMenuItem: function () { this.focusByIndex(this.menuItems.length - 1); },

    focusNextMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;
      const currentIndex = this.menuItems.indexOf(currentItem);
      const nextIndex = (currentIndex + 1) % this.menuItems.length;
      this.focusByIndex(nextIndex);
    },

    focusPreviousMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;
      const currentIndex = this.menuItems.indexOf(currentItem);
      const previousIndex = currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;
      this.focusByIndex(previousIndex);
    },

    focusByChar: function (currentItem, char) {
      char = char.toLowerCase();
      const itemChars = this.menuItems.map((menuItem) =>
        menuItem.textContent.trim()[0].toLowerCase()
      );
      const startIndex = (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;
      let index = itemChars.indexOf(char, startIndex);
      if (index === -1) index = itemChars.indexOf(char, 0);
      if (index > -1) this.focusByIndex(index);
    },

    outsideClickHandler: function (e) {
      if (
        this.isExpanded &&
        !this.toggle.contains(e.target) &&
        !e.composedPath().includes(this.menu)
      ) {
        this.dismiss();
        this.toggle.focus();
      }
    },

    clickHandler: function (event) {
      event.stopPropagation();
      event.preventDefault();

      if (this.isExpanded) {
        this.dismiss();
        this.toggle.focus();
      } else {
        this.open();
        this.focusFirstMenuItem();
      }
    },

    toggleKeyHandler: function (e) {
      const key = e.key;
      switch (key) {
        case "Enter": case " ": case "ArrowDown": case "Down": {
          e.stopPropagation(); e.preventDefault();
          this.open(); this.focusFirstMenuItem();
          break;
        }
        case "ArrowUp": case "Up": {
          e.stopPropagation(); e.preventDefault();
          this.open(); this.focusLastMenuItem();
          break;
        }
        case "Esc": case "Escape": {
          e.stopPropagation(); e.preventDefault();
          this.dismiss(); this.toggle.focus();
          break;
        }
      }
    },

    menuKeyHandler: function (e) {
      const key = e.key;
      const currentElement = this.menuItems[this.focusedIndex];
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      switch (key) {
        case "Esc": case "Escape": {
          e.stopPropagation(); e.preventDefault();
          this.dismiss(); this.toggle.focus();
          break;
        }
        case "ArrowDown": case "Down": {
          e.stopPropagation(); e.preventDefault();
          this.focusNextMenuItem(currentElement);
          break;
        }
        case "ArrowUp": case "Up": {
          e.stopPropagation(); e.preventDefault();
          this.focusPreviousMenuItem(currentElement);
          break;
        }
        case "Home": case "PageUp": {
          e.stopPropagation(); e.preventDefault();
          this.focusFirstMenuItem();
          break;
        }
        case "End": case "PageDown": {
          e.stopPropagation(); e.preventDefault();
          this.focusLastMenuItem();
          break;
        }
        case "Tab": {
          if (e.shiftKey) {
            e.stopPropagation(); e.preventDefault();
            this.dismiss(); this.toggle.focus();
          } else {
            this.dismiss();
          }
          break;
        }
        default: {
          if (isPrintableChar(key)) {
            e.stopPropagation(); e.preventDefault();
            this.focusByChar(currentElement, key);
          }
        }
      }
    },
  };

  // Dropdowns — initialise all toggles whose next sibling has dropdown-menu class
  window.addEventListener("DOMContentLoaded", () => {
    const dropdowns = [];
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
      const menu = toggle.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        dropdowns.push(new Dropdown(toggle, menu));
      }
    });
  });

  // Share
  window.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".share a");
    links.forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.open(anchor.href, "", "height = 500, width = 500");
      });
    });
  });

  // Debounce
  function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }

  // Search field
  let searchFormFilledClassName = "search-has-value";
  let searchFormSelector = "form[role='search']";

  function clearSearchInput(event) {
    const form = event.target.closest(searchFormSelector);
    if (!form) return;
    form.classList.remove(searchFormFilledClassName);
    let input;
    if (event.target.tagName === "INPUT" && event.target.type === "search") {
      input = event.target;
    } else {
      input = form.querySelector("input[type='search']");
    }
    if (!input) return;
    input.value = "";
    input.focus();
  }

  function clearSearchInputOnKeypress(event) {
    const searchInputDeleteKeys = ["Delete", "Escape"];
    if (searchInputDeleteKeys.includes(event.key)) {
      clearSearchInput(event);
    }
  }

  function buildClearSearchButton(inputId) {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-controls", inputId);
    button.classList.add("clear-button");
    const buttonLabel = window.searchClearButtonLabelLocalized;
    const icon = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${buttonLabel}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;
    button.innerHTML = icon;
    button.addEventListener("click", clearSearchInput);
    button.addEventListener("keyup", clearSearchInputOnKeypress);
    return button;
  }

  function appendClearSearchButton(input, form) {
    const searchClearButton = buildClearSearchButton(input.id);
    form.append(searchClearButton);
    if (input.value.length > 0) {
      form.classList.add(searchFormFilledClassName);
    }
  }

  const toggleClearSearchButtonAvailability = debounce((event) => {
    const form = event.target.closest(searchFormSelector);
    form.classList.toggle(searchFormFilledClassName, event.target.value.length > 0);
  }, 200);

  window.addEventListener("DOMContentLoaded", () => {
    const searchForms = [...document.querySelectorAll(searchFormSelector)];
    const searchInputs = searchForms.map((form) =>
      form.querySelector("input[type='search']")
    );
    searchInputs.forEach((input) => {
      appendClearSearchButton(input, input.closest(searchFormSelector));
      input.addEventListener("keyup", clearSearchInputOnKeypress);
      input.addEventListener("keyup", toggleClearSearchButtonAvailability);
    });
  });

  const key = "returnFocusTo";

  function saveFocus() {
    const activeElementId = document.activeElement.getAttribute("id");
    sessionStorage.setItem(key, "#" + activeElementId);
  }

  function returnFocus() {
    const returnFocusTo = sessionStorage.getItem(key);
    if (returnFocusTo) {
      sessionStorage.removeItem("returnFocusTo");
      const returnFocusToEl = document.querySelector(returnFocusTo);
      returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
    }
  }

  // Forms
  window.addEventListener("DOMContentLoaded", () => {
    returnFocus();

    const commentContainerTextarea = document.querySelector(".comment-container textarea");
    const commentContainerFormControls = document.querySelector(".comment-form-controls, .comment-ccs");

    if (commentContainerTextarea) {
      commentContainerTextarea.addEventListener("focus", function focusCommentContainerTextarea() {
        commentContainerFormControls.style.display = "block";
        commentContainerTextarea.removeEventListener("focus", focusCommentContainerTextarea);
      });

      if (commentContainerTextarea.value !== "") {
        commentContainerFormControls.style.display = "block";
      }
    }

    const showRequestCommentContainerTrigger = document.querySelector(
      ".request-container .comment-container .comment-show-container"
    );
    const requestCommentFields = document.querySelectorAll(
      ".request-container .comment-container .comment-fields"
    );
    const requestCommentSubmit = document.querySelector(
      ".request-container .comment-container .request-submit-comment"
    );

    if (showRequestCommentContainerTrigger) {
      showRequestCommentContainerTrigger.addEventListener("click", () => {
        showRequestCommentContainerTrigger.style.display = "none";
        Array.prototype.forEach.call(requestCommentFields, (element) => {
          element.style.display = "block";
        });
        requestCommentSubmit.style.display = "inline-block";
        if (commentContainerTextarea) commentContainerTextarea.focus();
      });
    }

    const requestMarkAsSolvedButton = document.querySelector(
      ".request-container .mark-as-solved:not([data-disabled])"
    );
    const requestMarkAsSolvedCheckbox = document.querySelector(
      ".request-container .comment-container input[type=checkbox]"
    );
    const requestCommentSubmitButton = document.querySelector(
      ".request-container .comment-container input[type=submit]"
    );

    if (requestMarkAsSolvedButton) {
      requestMarkAsSolvedButton.addEventListener("click", () => {
        requestMarkAsSolvedCheckbox.setAttribute("checked", true);
        requestCommentSubmitButton.disabled = true;
        requestMarkAsSolvedButton.setAttribute("data-disabled", true);
        requestMarkAsSolvedButton.form.submit();
      });
    }

    const requestCommentTextarea = document.querySelector(
      ".request-container .comment-container textarea"
    );

    const usesWysiwyg = requestCommentTextarea && requestCommentTextarea.dataset.helper === "wysiwyg";

    function isEmptyPlaintext(s) { return s.trim() === ""; }

    function isEmptyHtml(xml) {
      const doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
      const img = doc.querySelector("img");
      return img === null && isEmptyPlaintext(doc.children[0].textContent);
    }

    const isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

    if (requestCommentTextarea) {
      requestCommentTextarea.addEventListener("input", () => {
        if (isEmpty(requestCommentTextarea.value)) {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText = requestMarkAsSolvedButton.getAttribute("data-solve-translation");
          }
        } else {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText = requestMarkAsSolvedButton.getAttribute("data-solve-and-submit-translation");
          }
        }
      });
    }

    const selects = document.querySelectorAll("#request-status-select, #request-organization-select");
    selects.forEach((element) => {
      element.addEventListener("change", (event) => {
        event.stopPropagation();
        saveFocus();
        element.form.submit();
      });
    });

    const quickSearch = document.querySelector("#quick-search");
    if (quickSearch) {
      quickSearch.addEventListener("keyup", (event) => {
        if (event.keyCode === ENTER) {
          event.stopPropagation();
          saveFocus();
          quickSearch.form.submit();
        }
      });
    }

    const requestOrganisationSelect = document.querySelector("#request-organization select");
    if (requestOrganisationSelect) {
      requestOrganisationSelect.addEventListener("change", () => {
        requestOrganisationSelect.form.submit();
      });
      requestOrganisationSelect.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    const notificationElm = document.querySelector(".notification-error");
    if (
      notificationElm &&
      notificationElm.previousElementSibling &&
      typeof notificationElm.previousElementSibling.focus === "function"
    ) {
      notificationElm.previousElementSibling.focus();
    }
  });

  // Custom JS
  const pathName = window.location.pathname;

  if (/\/hc\/[^\/]+\/?$/.test(pathName)) {
    $('body').addClass('home-active');
  }

  // Sticky header — updated for new rm-header class
  var $window = $(window);
  var $topbar = $('header.rm-header');
  var topbarHeight = parseInt($topbar.outerHeight());

  $('body').css('--topbar-height', topbarHeight + 'px');

  function onWindowScroll() {
    var scrollOffset = $window.scrollTop();
    $topbar.toggleClass('header--fixed', scrollOffset > (topbarHeight * 2));
  }
  $window.on('scroll', onWindowScroll);
  onWindowScroll();

  // Error page redirect
  var notDefaultLanguage = window.location.href.indexOf('/en-us/') == -1;
  var isArticle = window.location.href.indexOf('/articles/') > -1;
  var isErrorPage = $(".error-page").length > 0;

  if (isArticle && notDefaultLanguage && isErrorPage) {
    var newURL = window.location.href.replace(/(.*\/hc\/)([\w-]+)(\/.*)/, "$1en-us$3");
    window.location.href = newURL;
  }

  // Social share popups
  $('.share a').click(function (e) {
    e.preventDefault();
    window.open(this.href, '', 'height = 500, width = 500');
  });

  // Tabs
  $('.tabs-link').click(function (e) {
    e.preventDefault();
    var $link = $(this);
    var tabIndex = $link.index();
    var $tab = $link.parents('.tabs').find('.tab').eq(tabIndex);

    $link.addClass('is-active').siblings().removeClass('is-active');
    $tab.removeClass('is-hidden').siblings('.tab').addClass('is-hidden');
  });

  // Video popups
  $('.image-with-video-icon').magnificPopup({
    disableOn: 700,
    type: 'iframe',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,
    fixedContentPos: false
  });

  // Image popups
  $('.image-with-lightbox').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    closeBtnInside: false,
    fixedContentPos: true,
    mainClass: 'mfp-with-zoom',
    image: { verticalFit: true },
    zoom: { enabled: true, duration: 300 }
  });

  // Accordions
  $('.accordion__item-title').on('click', function () {
    var $title = $(this);
    $title.toggleClass('accordion__item-title--active');
    $title.parent('.accordion__item').find('.accordion__item-content').slideToggle();
  });

  // Start of Swifteq helpcenter manager analytics script
  window.hcm = {};
  function hcmanager(account_key, dataset_id, domain, script_url) {
    window.hcm._accountKey = account_key;
    window.hcm._datasetId = dataset_id;
    window.hcm._domain = domain;
    var script = document.createElement("script");
    script.type = "application/javascript";
    script.src = script_url;
    var first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(script, first);
  }
  hcmanager('9c678b75ea3a2211d205d8da3899891d', '605da4e4b393066b59b657d4', 'https://hcmanager.swifteq.com', 'https://scripts.swifteq.com/hc_events.js');
  // End of Swifteq helpcenter manager analytics script

  // Pre-fill Form & Hide Fields in request form
  window.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("new-request-form");
    if (container) {
      const observer = new MutationObserver(() => {
        const form = container.querySelector("form");
        const formField = container.querySelector("input[name='request[ticket_form_id]']");

        if (form && formField) {
          const subjectField = container.querySelector("input[name='request[subject]']");
          const descriptionField = container.querySelector("textarea[name='request[description]']");

          if (subjectField && descriptionField) {
            if (formField.value === "20474319990034") {
              subjectField.value = "Feedback ticket";
              descriptionField.value = "Feedback ticket";

              subjectField.closest('div[data-garden-id=\'forms.field\']').style.display = "none";
              descriptionField.closest('div[data-garden-id=\'forms.field\']').style.display = "none";

              const goal = document.querySelector("textarea[name='request[custom_fields][20448704398610]']");
              const problem = document.querySelector("textarea[name='request[custom_fields][20448776087954]']");

              const goalTitle = container.querySelector("label[for='" + goal.id + "']");
              const problemTitle = container.querySelector("label[for='" + problem.id + "']");

              const updateDescription = function (event) {
                let text = "<p></p><strong>" + goalTitle.innerText + "</strong><br>";
                text += goal.value.replace(/\r?\n/g, "<br />") + "</p>";
                text += "<p></p><strong>" + problemTitle.innerText + "</strong><br>";
                text += problem.value.replace(/\r?\n/g, "<br />") + "</p>";
                descriptionField.value = text;
                const domEditableElement = descriptionField.parentNode.querySelector('.ck-editor__editable');
                const editorInstance = domEditableElement.ckeditorInstance;
                editorInstance.setData(text);
              };
              goal.addEventListener('keyup', updateDescription);
              problem.addEventListener('keyup', updateDescription);
            }
            observer.disconnect();
          }
        }
      });

      observer.observe(container, { childList: true, subtree: true });
    }
  });

  // Implementation Guide modal — close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.getElementById('rm-impl-modal') && document.getElementById('rm-impl-modal').classList.remove('is-open');
    }
  });

  // Strip time from search result dates — show date only
  document.querySelectorAll('.search-result-meta-container time').forEach(function(el) {
    var dt = el.getAttribute('datetime');
    if (dt) {
      var d = new Date(dt);
      el.textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else {
      // Fallback: strip everything after the date via text
      el.textContent = el.textContent.replace(/\s+at\s+\d+:\d+.*$/i, '').trim();
    }
  });


  // ── Header search overlay ───────────────────────────────────────────────
  (function () {
    var searchBtn   = document.getElementById('rm-header-search-btn');
    var overlay     = document.getElementById('rm-header-search-overlay');
    var searchInput = document.getElementById('rm-header-search-input');
    var goBtn       = document.getElementById('rm-header-search-go');
    var closeBtn    = document.getElementById('rm-header-search-close');

    if (!searchBtn || !overlay) return;

    // Hide the search icon on the search results page — it already has a search bar
    if (window.location.pathname.indexOf('/search') > -1) {
      searchBtn.style.display = 'none';
      return;
    }

    function openSearch() {
      overlay.classList.add('is-open');
      searchBtn.classList.add('is-active');
      searchBtn.setAttribute('aria-expanded', 'true');
      overlay.setAttribute('aria-hidden', 'false');
      setTimeout(function () { if (searchInput) searchInput.focus(); }, 50);
    }

    function closeSearch() {
      overlay.classList.remove('is-open');
      searchBtn.classList.remove('is-active');
      searchBtn.setAttribute('aria-expanded', 'false');
      overlay.setAttribute('aria-hidden', 'true');
      if (searchInput) searchInput.value = '';
      searchBtn.focus();
    }

    function submitSearch() {
      if (!searchInput || !searchInput.value.trim()) return;
      var localeMatch = window.location.pathname.match(/^\/hc\/([^/]+)/);
      var locale = localeMatch ? localeMatch[1] : 'en-us';
      window.location.href = '/hc/' + locale + '/search?utf8=%E2%9C%93&query=' + encodeURIComponent(searchInput.value.trim());
    }

    searchBtn.addEventListener('click', function () {
      overlay.classList.contains('is-open') ? closeSearch() : openSearch();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeSearch);
    if (goBtn) goBtn.addEventListener('click', submitSearch);
    if (searchInput) {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submitSearch();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeSearch();
    });
  }());

  // CKEditor mobile width fix — CKEditor JS sets a fixed pixel width at init
  // based on its container before the flex layout has settled. We watch for
  // the editor appearing in the DOM and force a resize after it initialises.
  if (document.querySelector('.request-container')) {
    var ckObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            var editor = node.classList && node.classList.contains('ck-editor')
              ? node
              : node.querySelector && node.querySelector('.ck-editor');
            if (editor) {
              setTimeout(function() {
                window.dispatchEvent(new Event('resize'));
              }, 100);
            }
          }
        });
      });
    });
    var commentContainer = document.querySelector('.comment-container');
    if (commentContainer) {
      ckObserver.observe(commentContainer, { childList: true, subtree: true });
    }
  }

  // ── Article TOC ─────────────────────────────────────────
  // Builds a sticky table of contents from H1/H2 in .article-body.
  // Injects clean slug-based anchors (e.g. #equipment-tab) before each heading
  // so URLs are readable. Matches the old TableOfContents lib's slug algorithm
  // for backwards compatibility with bookmarked URLs.
  // Hidden by default; revealed only when 2+ headings exist.
  // Headings without an id (e.g. articles created via the API or an import,
  // where the Zendesk editor never added one) get a generated id, so the TOC
  // and scroll-spy work for them too.
  (function initArticleTOC() {
    var body = document.querySelector('[data-article] .article-body');
    if (!body) return;

    var headings = Array.prototype.slice
      .call(body.querySelectorAll('h1, h2'))
      .filter(function (h) { return h.textContent.trim().length > 0; });
    headings.forEach(function (h, n) {
      if (!h.id) { h.id = 'rm-toc-heading-' + (n + 1); }
    });
    if (headings.length < 2) return;

    var toc = document.querySelector('.rm-article-toc');
    if (!toc) return;
    var list = toc.querySelector('.rm-article-toc__list');
    if (!list) return;

    // Slug generator — matches old library's convertToSlug() exactly so
    // existing bookmarked URLs keep working. Lowercase, strip non-word chars
    // (keeping spaces), then spaces → hyphens.
    function convertToSlug(s) {
      return s.toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    }

    // Pre-populate used IDs to avoid collisions with existing page elements
    var usedSlugs = {};
    Array.prototype.slice.call(document.querySelectorAll('[id]')).forEach(function (el) {
      usedSlugs[el.id] = true;
    });

    // Generate slugs and inject anchors
    var slugByHeading = [];
    headings.forEach(function (h) {
      var base = convertToSlug(h.textContent.trim()) || 'section';
      var slug = base;

      // If the heading already has this exact ID (author-defined), reuse it — no injection needed
      if (h.id === base) {
        slugByHeading.push({ heading: h, slug: base });
        return;
      }

      // Otherwise dedupe and inject a new anchor
      var i = 2;
      while (usedSlugs[slug]) {
        slug = base + '-' + i;
        i++;
      }
      usedSlugs[slug] = true;
      slugByHeading.push({ heading: h, slug: slug });

      var anchor = document.createElement('span');
      anchor.id = slug;
      anchor.className = 'rm-toc-anchor';
      anchor.setAttribute('aria-hidden', 'true');
      h.parentNode.insertBefore(anchor, h);
    });

    // Build TOC list
    slugByHeading.forEach(function (entry) {
      var h = entry.heading;
      var slug = entry.slug;

      var li = document.createElement('li');
      li.className = 'rm-article-toc__item rm-article-toc__item--' + h.tagName.toLowerCase();
      li.dataset.target = h.id;

      var a = document.createElement('a');
      a.href = '#' + slug;
      a.className = 'rm-article-toc__link';
      a.textContent = h.textContent.trim();

      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(slug);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (history.pushState) {
          history.pushState(null, '', '#' + slug);
        } else {
          location.hash = '#' + slug;
        }
      });

      li.appendChild(a);
      list.appendChild(li);
    });

    // Reveal
    toc.removeAttribute('hidden');

    // Handle hash on initial load — browser tried to scroll before our anchors existed
    if (location.hash) {
      try {
        var hashId = decodeURIComponent(location.hash.slice(1));
        var hashTarget = document.getElementById(hashId);
        if (hashTarget) {
          requestAnimationFrame(function () {
            hashTarget.scrollIntoView({ block: 'start' });
          });
        }
      } catch (e) { /* malformed hash, ignore */ }
    }

    // Scroll-spy: topmost heading whose top is above the trigger line is active
    var items = Array.prototype.slice.call(list.querySelectorAll('.rm-article-toc__item'));
    var activeId = headings[0].id;
    items[0].classList.add('is-active');

    function setActive(id) {
      if (id === activeId) return;
      items.forEach(function (i) {
        i.classList.toggle('is-active', i.dataset.target === id);
      });
      activeId = id;
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var triggerY = 100; // ~80px header + 20px buffer
        var current = headings[0].id;
        for (var i = 0; i < headings.length; i++) {
          if (headings[i].getBoundingClientRect().top <= triggerY) {
            current = headings[i].id;
          } else {
            break;
          }
        }
        setActive(current);
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Set initial state in case page loaded mid-scroll or with #hash
  })();

}());
