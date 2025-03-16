// ==UserScript==
// @name        Threads Fixer
// @namespace   https://github.com/shapoco/threads-fixer/raw/refs/heads/main/dist/
// @updateURL   https://github.com/shapoco/threads-fixer/raw/refs/heads/main/dist/threads-fixer.user.js
// @downloadURL https://github.com/shapoco/threads-fixer/raw/refs/heads/main/dist/threads-fixer.user.js
// @match       https://www.threads.net/*
// @version     1.0.14
// @author      Shapoco
// @description Threads の「アクティビティ」で「おすすめ」などを目立たなくします
// @run-at      document-start
// ==/UserScript==

(function () {
  'use strict';

  const APP_NAME = 'Threads Fixer';

  const PROCESS_INTERVAL_MS = 300;

  const RE_RECOMMEND = /^(おすすめ|スレッドを開始しました)$/;

  class ThreadsFixer {
    constructor() {
      this.lastLocation = null;
      this.knownElems = [];
      this.intervalId = -1;
    }

    start() {
      window.onload = async () => {
        const body = document.querySelector('body');
        const observer = new MutationObserver((mutations) => {
          if (this.lastLocation != document.location.href) {
            // ページが遷移したらいったん初期化する
            this.lastLocation = document.location.href;
            this.knownElems = [];
          }
        });
        observer.observe(body, { childList: true, subtree: true });
      };

      this.intervalId = window.setInterval(() => {
        if (document.location.href.match(/^https:\/\/www\.threads\.net\/activity/)) {
          // 「アクティビティ」のページでのみ定期的に処理を実行する
          this.scanActivity();
        }
      }, PROCESS_INTERVAL_MS);
    }

    scanActivity() {
      // 「おすすめ」などと書かれた要素を探す
      const spans = Array.from(document.querySelectorAll('span'))
        .filter(span => !!span.textContent.match(RE_RECOMMEND));

      for (const span of spans) {
        if (!this.knownElems.includes(span)) {
          // 未処理の要素に対して処理を行う
          this.knownElems.push(span);
          this.processSpan(span);
        }
      }
    }

    processSpan(span) {
      let elm = span.parentElement;
      let divs = [];

      // 親要素をたどって通知のエントリ全体を含む要素を見つける
      while (elm) {
        if (elm.dataset.pressableContainer) {
          // elm要素の直下にあるdivの配列 (直下より下層は含まない)
          divs = Array.from(elm.querySelectorAll(':scope > div'));
          if (divs.length >= 2) {
            divs.shift();
          }
        }
        // プロフィールアイコンをひとつだけ含む要素を見つける
        const imgs = Array.from(elm.querySelectorAll('img[alt$="のプロフィール写真"]'));
        if (imgs.length == 1) {
          break;
        }
        else if (imgs.length > 1) {
          return;
        }
        elm = elm.parentElement;
      }
      if (!elm) return;

      // 完全に非表示にすると続きがどんどん読み込まれてしまうので薄くするだけにする
      elm.style.opacity = 0.3;
      // elm.style.display = 'none';

      // 本文は完全に見えなくする
      if (divs) {
        divs.forEach(div => {
          div.style.opacity = 0;
        });
      }
    }
  }

  window.thfix = new ThreadsFixer();
  window.thfix.start();

})();
