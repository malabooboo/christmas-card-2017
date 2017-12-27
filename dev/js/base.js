/** Defines DOM selectors */
const ELEMENT = {
  CARD_CONTENT : '.card__content',
  CONTINUE_BUTTON : '.card__continue',
  CARD_SECTION : 'card',
  OVERLAY : '.overlay',
  OVERLAY_IMAGE : '.overlay__image',
  OVERLAY_CAPTION : '.overlay__caption',
  OVERLAY_CLOSE : '.overlay__close',
  OVERLAY_LEFT : '.overlay__left-button',
  OVERLAY_RIGHT : '.overlay__right-button',
  PHOTOS : '.grid__photo'
}

/** Defines names */
const CLASS_NAME = {
  CARD_SECTION : 'card',
  YEAR_SECTION : 'year',
  OVERLAY : 'overlay',
  OVERLAY_CLOSE : 'overlay__close',
  OVERLAY_LEFT : 'overlay__left-button',
  OVERLAY_RIGHT : 'overlay__right-button',
  PHOTOS : 'grid__photo'
}

/** Defines Event types */
const EVENT = {
  CLICK : 'click',
  SCROLL : 'scroll',
  KEYDOWN : 'keydown'
}

/** Defines state types */
const STATE = {
  SHOWN : '--shown',
  IN_VIEW : '--in-view'
}

class Card {
  constructor() {
    /** @private {number} Sets the initial scroll position */
    this.scrollPosition_ = 0;

    /** @private {Element} */
    this.cardContentEl_ = document.querySelector(ELEMENT.CARD_CONTENT);

    /** @private {Element} */
    this.continueButtonEl_ = document.querySelector(ELEMENT.CONTINUE_BUTTON);

    /** @private {Element} */
    this.cardSectionEl_ = document.getElementById(CLASS_NAME.CARD_SECTION);

    /** @private {number} */
    this.cardSectionHeight_ = this.cardSectionEl_.offsetHeight;

    /** @private {Element} */
    this.yearSectionEl_ = document.getElementById(CLASS_NAME.YEAR_SECTION);

    /** @private {Element} */
    this.overlayEl_ = document.querySelector(ELEMENT.OVERLAY);

    /** @private {Element} */
    this.overlayImageEl_ = document.querySelector(ELEMENT.OVERLAY_IMAGE);

    /** @private {Element} */
    this.overlayCaptionEl_ = document.querySelector(ELEMENT.OVERLAY_CAPTION);

    /** @private {Element} */
    this.overlayCloseEl_ = document.querySelector(ELEMENT.OVERLAY_CLOSE);

    /** @private {Element} */
    this.overlayLeftEl_ = document.querySelector(ELEMENT.OVERLAY_LEFT);

    /** @private {Element} */
    this.overlayRightEl_ = document.querySelector(ELEMENT.OVERLAY_RIGHT);

    /** @private {Nodelist} */
    this.photoEls_ = document.querySelectorAll(ELEMENT.PHOTOS);

    /** @private {array} */
    this.photoData_ = [];

    this.setImageHeights_();
    this.createEventListeners_();
    this.buildPhotoData_();
  }

  /**
   * Builds a photo data object from the <figure> elements on the page
   * @private
   */
  buildPhotoData_() {
    for (let photoEl of this.photoEls_) {
      let photoUrl = photoEl.dataset.src;
      let photoUrlLarge = photoUrl.replace(/-800/i, '-1500');
      let photoCaption =
          photoEl.nextElementSibling.innerHTML.replace(/^\s+|\s+$/g, '');
      this.photoData_.push(
          {'photoUrl' : photoUrlLarge, 'photoCaption' : photoCaption});
    }
  }

  /**
   * Sets up all event listeners on the page
   * @private
   */
  createEventListeners_() {
    // Adds scroll to year section from entire card content area.
    this.cardContentEl_.addEventListener(
        EVENT.CLICK, e => { this.continueButtonEl_.click(); }, false, this);

    // Adds scroll event listener.
    window.addEventListener(EVENT.SCROLL, e => {
      let startScrollPosition = this.scrollPosition_;
      // Firefox doesn't support document.body.scrollTop.
      let scrollPosition = window.pageYOffset ||
                           document.documentElement.scrollTop ||
                           document.body.scrollTop || 0;
      this.scrollPosition_ = scrollPosition;
      this.scrollHandler_(startScrollPosition, this.scrollPosition_);
    });

    // Adds an event listener for photos.
    this.yearSectionEl_.addEventListener(
        EVENT.CLICK, e => { this.openOverlay_(e.target); }, false, this);

    // Adds an event listener for the overlay close, previous, and next buttons,
    // and overlay background.
    this.overlayEl_.addEventListener('click', e => {
      e.preventDefault();
      let clickedEl = e.target;
      if (clickedEl.classList.contains(CLASS_NAME.OVERLAY) ||
          this.findElementOrAncestorWithClass_(clickedEl,
                                               CLASS_NAME.OVERLAY_CLOSE)) {
        this.closeOverlay_();
      } else if (this.findElementOrAncestorWithClass_(
                     clickedEl, CLASS_NAME.OVERLAY_LEFT)) {
        this.previousOverlaySlide_();
      } else if (this.findElementOrAncestorWithClass_(
                     clickedEl, CLASS_NAME.OVERLAY_RIGHT)) {
        this.nextOverlaySlide_();
      }
    }, false, this);

    // Adds event listeners for keyboard presses for the overlay.
    window.addEventListener(EVENT.KEYDOWN, e => {
      if (!this.overlayEl_.classList.contains(CLASS_NAME.OVERLAY +
                                              STATE.SHOWN)) {
        return;
      }
      switch (e.keyCode) {
      case 37:
        this.overlayLeftEl_.click();
        break;
      case 39:
        this.overlayRightEl_.click();
        break;
      case 27:
        this.overlayCloseEl_.click();
        break;
      }
    }, false);
  }

  /**
   * Handles scroll.
   * @param {number} startScrollPosition
   * @param {number} scrollPosition
   * @private
   */
  scrollHandler_(startScrollPosition, scrollPosition) {
    let yearInView = CLASS_NAME.YEAR_SECTION + STATE.IN_VIEW;
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        if (this.scrollPosition_ >
            this.cardSectionHeight_ - (this.cardSectionHeight_ / 2)) {
          if (!this.yearSectionEl_.classList.contains(yearInView)) {
            this.yearSectionEl_.classList.add(yearInView);
            this.lazyLoadImages_();
          }
        }
        this.ticking = false;
      });
    }
    this.ticking = true;
  }

  /**
   * Starts loading images within a given month.
   * @private
   */
  lazyLoadImages_() {
    let yearPhotoEls = this.yearSectionEl_.querySelectorAll(ELEMENT.PHOTOS);
    // for (let photo of yearPhotoEls) {
    for (var i = 0, photo; photo = yearPhotoEls[i]; i++) {
      photo.src = photo.dataset.src;
      photo.classList.add(CLASS_NAME.PHOTOS + STATE.SHOWN);
      // Removes data-src and height attributes after a staggered delay.
      setTimeout(function() {
        // Binds "this" to photo.
        delete this.dataset.src;
        this.removeAttribute('height');
      }.bind(photo, i), 200 * i);
    }
  }

  /**
   * Sets image initial heights manually before they have been lazy loaded.
   * @private
   */
  setImageHeights_() {
    for (let imageEl of this.photoEls_) {
      // Images are at a 3:2 ratio.
      let initialHeight = imageEl.offsetWidth * .67;
      imageEl.setAttribute('height', initialHeight);
    }
  }

  /**
   * Builds and shows overlay.
   * @param {string} photoUrl
   * @private
   */
  openOverlay_(photoEl) {
    this.lockScroll_();
    let overlayShown = CLASS_NAME.OVERLAY + STATE.SHOWN;
    let imgSource = photoEl;
    if (!photoEl.classList.contains(CLASS_NAME.PHOTOS)) {
      return;
    }

    let imgZoomSource = imgSource.getAttribute('src');
    let imgZoomLarge = imgZoomSource.replace(/-800/i, '-1500');
    let imgZoomCaption = imgSource.nextElementSibling.innerHTML;
    this.fillOverlayContent_(imgZoomLarge, imgZoomCaption);
    this.overlayEl_.classList.add(overlayShown);
  }

  /**
   * Fills the overlay with content.
   * @param {string} photoUrl
   * @param {string} photoCaption
   * @private
   */
  fillOverlayContent_(photoUrl, photoCaption) {
    this.overlayImageEl_.setAttribute('src', photoUrl);
    this.overlayCaptionEl_.innerHTML = photoCaption;
  }

  /**
   * Closes the overlay
   * @private
   */
  closeOverlay_() {
    this.unlockScroll_();
    let overlayShown = CLASS_NAME.OVERLAY + STATE.SHOWN;
    if (!this.overlayEl_.classList.contains(overlayShown)) {
      return;
    }
    this.overlayEl_.classList.remove(overlayShown);
  }

  /**
   * Advances the overlay content back based on photo data.
   * @private
   */
  previousOverlaySlide_() {
    let currentUrl = this.overlayImageEl_.getAttribute('src');
    let nextSlideUrl;
    let nextSlideCaption;
    for (let slide in this.photoData_) {
      // Matches the overlay's current photo with it's position in the array.
      if (this.photoData_[slide]['photoUrl'] == currentUrl) {
        let previousSlide;
        if (slide - 1 < 0) {
          previousSlide = this.photoEls_.length - 1;
        } else {
          previousSlide = slide - 1;
        }
        nextSlideUrl = this.photoData_[previousSlide]['photoUrl'];
        nextSlideCaption = this.photoData_[previousSlide]['photoCaption'];
        this.fillOverlayContent_(nextSlideUrl, nextSlideCaption);
        break;
      }
    }
  }

  /**
   * Advances the overlay content forward based on photo data.
   * @private
   */
  nextOverlaySlide_() {
    let currentUrl = this.overlayImageEl_.getAttribute('src');
    let nextSlideUrl;
    let nextSlideCaption;
    for (let slide in this.photoData_) {
      // Matches the overlay's current photo with it's position in the array.
      if (this.photoData_[slide]['photoUrl'] == currentUrl) {
        let nextSlide;
        if (parseFloat(slide) + 1 == this.photoEls_.length) {
          nextSlide = 0;
        } else {
          nextSlide = parseFloat(slide) + 1;
        }
        nextSlideUrl = this.photoData_[nextSlide]['photoUrl'];
        nextSlideCaption = this.photoData_[nextSlide]['photoCaption'];
        this.fillOverlayContent_(nextSlideUrl, nextSlideCaption);
        break;
      }
    }
  }

  /**
   * Locks scroll.
   * @private
   */
  lockScroll_() {
    if (document.body.classList.contains('scroll-locked')) {
      return;
    }
    document.body.classList.add('scroll-locked');
  }

  /**
   * Unlocks scroll.
   * @private
   */
  unlockScroll_() {
    if (!document.body.classList.contains('scroll-locked')) {
      return;
    }
    document.body.classList.remove('scroll-locked');
  }

  /**
   * Traverses up the DOM to find an ancestor with a class.
   * @param {Element} element The element to start searching.
   * @param {string} className The class name to match.
   * @private
   */
  findElementOrAncestorWithClass_(element, className) {
    if (!element || element.length === 0) {
      return false;
    }
    var parent = element;
    do {
      if (parent === document) {
        break;
      }
      if (parent.classList.contains(className)) {
        return true;
      }
    } while (parent = parent.parentNode);
    return false;
  }
}
