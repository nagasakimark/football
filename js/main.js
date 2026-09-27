// ============================================================
//  Boot
// ============================================================
'use strict';

window.addEventListener('DOMContentLoaded', () => {
  Settings.load();
  Engine.init(document.getElementById('game'));
  Engine.setScene(LoadingScene);
});
