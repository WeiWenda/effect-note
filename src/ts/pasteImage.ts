import EventEmitter from 'events';
import {useEffect, useMemo, useRef, useState} from 'react';

class PasteImage extends EventEmitter {
  private _initialized: boolean = false;
  private _pasteCatcher!: HTMLDivElement;
  constructor() {
    super();
    this._init();
  }

  public _clipboardSupported () {
    return window.Clipboard;
  }

  public _pasteCatcherFocus () {
    this._pasteCatcher.focus();
  };

  public _listenForClick () {
    let self = this;

    // Make sure it is always in focus. We ignore code coverage for this area as there does not appear
    // to be an easy cross-browser way of triggering a click event on the document
    //
    /* istanbul ignore next */
    document.addEventListener('click', function () {
      self._pasteCatcherFocus();
    });
  }

  public _createPasteCatcherIfNeeded () {
    // We start by checking if the browser supports the Clipboard object. If not, we need to create a
    // contenteditable element that catches all pasted data
    if (!this._clipboardSupported()) {
      this._pasteCatcher = document.createElement('div');

      // Firefox allows images to be pasted into contenteditable elements
      this._pasteCatcher.setAttribute('contenteditable', '');

      // We can hide the element and append it to the body,
      this._pasteCatcher.style.opacity = '0';

      // Use absolute positioning so that the paste catcher doesn't take up extra space. Note: we
      // cannot set style.display='none' as this will disable the functionality.
      this._pasteCatcher.style.position = 'absolute';

      document.body.appendChild(this._pasteCatcher);

      this._pasteCatcher.focus();
      this._listenForClick();
    }
  }

  public _listenForPaste () {
    let self = this;

    // Add the paste event listener. We ignore code coverage for this area as there does not appear to
    // be a cross-browser way of triggering a pase event
    //
    /* istanbul ignore next */
    window.addEventListener('paste', function (e) {
      self._pasteHandler(e);
    });
  }

  public _pasteHandler (e: any) {
    // Starting to paste image
    this.emit('pasting-image', e);

    // We need to check if event.clipboardData is supported (Chrome)
    if (e.clipboardData && e.clipboardData.items) {
      // Get the items from the clipboard
      let items = e.clipboardData.items;

      // Loop through all items, looking for any kind of image
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          // We need to represent the image as a file
          let blob = items[i].getAsFile();

          // Use a URL or webkitURL (whichever is available to the browser) to create a temporary URL
          // to the object
          let URLObj = this._getURLObj();
          let source = URLObj.createObjectURL(blob);

          // The URL can then be used as the source of an image
          this._createImage(source);
        }
      }
      // If we can't handle clipboard data directly (Firefox), we need to read what was pasted from
      // the contenteditable element
    } else {
      this._checkInputOnNextTick();
    }
  }
  public _init () {
    this._createPasteCatcherIfNeeded();
    this._listenForPaste();
    this._initialized = true;
  }

  public _checkInputOnNextTick () {
    let self = this;
    // This is a cheap trick to make sure we read the data AFTER it has been inserted.
    setTimeout(function () {
      self._checkInput();
    }, 1);
  }

  public _getURLObj () {
    return window.URL || window.webkitURL;
  }

  public _checkInput () {
    // Store the pasted content in a letiable
    let child = this._pasteCatcher.children[0];

    // Clear the inner html to make sure we're always getting the latest inserted content
    this._pasteCatcher.innerHTML = '';

    if (child) {
      // If the user pastes an image, the src attribute will represent the image as a base64 encoded
      // string.
      if (child.tagName === 'IMG') {
        this._createImage((child as HTMLImageElement).src);
      }
    }
  }

  public _createImage (source: string) {

    const  pastedImage = new Image();
    pastedImage.onload = () => {
      this.emit('paste-image', pastedImage);
    };
    pastedImage.src = source;
  }
}
const pasteImage = new PasteImage();
let i = 0;
const stack: number[] = [];
export function usePasteImage(onPasteImage: (img: HTMLImageElement) => void) {
  const callbackRef = useRef<(img: HTMLImageElement) => void>();
  const idRef = useRef(i++);
  useMemo(() => {
    callbackRef.current = onPasteImage;
  }, [onPasteImage]);
  useEffect(() => {
    stack.push(idRef.current);
    const onPaste = (img: HTMLImageElement) => {
      if (stack[stack.length - 1] === idRef.current) {
        callbackRef.current?.(img);
      }
    };
    pasteImage.on('paste-image', onPaste);
    return () => {
      stack.pop();
      pasteImage.removeListener('paste-image', onPaste);
    };
  }, []);
}
export default pasteImage;
