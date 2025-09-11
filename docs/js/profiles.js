// public/js/profiles.js
(function () {
  const KEY = 'xsf_profiles_v1';
  const ACTIVE_KEY = 'xsf_active_profile_v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  }
  function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

  function loadActive() { return localStorage.getItem(ACTIVE_KEY) || ''; }
  function saveActive(id) { localStorage.setItem(ACTIVE_KEY, id || ''); }

  // Seed defaults once (no external avatar URLs to avoid 404s)
  let profiles = load();
  if (!profiles.length) {
    profiles = [
      { id: 'p1', name: 'Hector',  avatar: '', kids: false },
      { id: 'p2', name: 'Allison', avatar: '', kids: true  },
      { id: 'p3', name: 'Emma',    avatar: '', kids: false }
    ];
    save(profiles);
  }

  function genId() { return 'p' + Math.random().toString(36).slice(2, 8); }

  const API = {
    list() { return load(); },
    activeId() { return loadActive(); },
    active() {
      const id = loadActive();
      return (load().find(p => p.id === id) || null);
    },
    setActive(id) {
      const exists = load().some(p => p.id === id);
      if (exists) saveActive(id);
      return exists;
    },
    add(name, avatar, kids=false) {
      const list = load();
      const p = { id: genId(), name: name || 'New', avatar: avatar || '', kids: !!kids };
      list.push(p); save(list); return p;
    },
    rename(id, name) {
      const list = load();
      const p = list.find(x => x.id === id); if (p) { p.name = name || p.name; save(list); }
      return p;
    },
    remove(id) {
      let list = load().filter(x => x.id !== id); save(list);
      if (loadActive() === id) saveActive('');
    }
  };

  window.Profiles = API;
})();
