/**
 * ITD AOMS – Sidebar RBAC Engine
 * Include this script in every internal page (not front.html / client.html).
 * Call:  applySidebarRBAC('<module_key>');
 *
 * Module keys:
 *   dashboard, service_requests, website_posting,
 *   network_monitoring, systems_monitoring, database_monitoring,
 *   hardware_assets, software_assets
 */
(function () {

  const MODULE_NAV_MAP = {
    dashboard: 'nav-dashboard',
    service_requests: 'nav-service-requests',
    website_posting: 'nav-website-posting',
    network_monitoring: 'nav-network',
    systems_monitoring: 'nav-systems',
    database_monitoring: 'nav-database',
    hardware_assets: 'nav-hardware',
    software_assets: 'nav-software',
  };

  // Groups: [group container id, [child module keys]]
  const GROUPS = [
    ['nav-services-group', ['service_requests', 'website_posting']],
    ['nav-ops-group', ['network_monitoring', 'systems_monitoring', 'database_monitoring']],
    ['nav-assets-group', ['hardware_assets', 'software_assets']],
  ];

  /**
   * Main entry point.
   * @param {string} currentModule – module key for the current page
   */
  window.applySidebarRBAC = function (currentModule) {
    const role = localStorage.getItem('role') || '';

    // Admin sees everything — only hide User Management for non-admins (handled separately)
    if (role === 'Admin') {
      showAll();
      updateSidebarUser();
      return;
    }

    if (role === 'Staff') {
      const staffId = localStorage.getItem('staff_user_id');
      const users = _loadUsers();
      const user = users.find(u => String(u.id) === String(staffId));
      const modules = (user && user.modules) ? user.modules : {};

      // Guard: redirect if this page's module is not permitted
      if (currentModule && !modules[currentModule]) {
        // Find first permitted module and redirect
        const firstAllowed = Object.keys(MODULE_NAV_MAP).find(k => modules[k]);
        const redirectMap = {
          dashboard: 'dashboard.html',
          service_requests: 'services.html',
          website_posting: 'posting.html',
          network_monitoring: 'network.html',
          systems_monitoring: 'systems.html',
          database_monitoring: 'database.html',
          hardware_assets: 'assets.html',
          software_assets: 'softwareasset.html',
        };
        window.location.href = firstAllowed ? redirectMap[firstAllowed] : 'dashboard.html';
        return;
      }

      // Show/hide individual nav items
      Object.entries(MODULE_NAV_MAP).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.style.display = modules[key] ? '' : 'none';
      });

      // Show/hide group dropdowns (hide if ALL children hidden)
      GROUPS.forEach(([groupId, childKeys]) => {
        const group = document.getElementById(groupId);
        if (!group) return;
        const anyVisible = childKeys.some(k => modules[k]);
        group.style.display = anyVisible ? '' : 'none';
      });

      // Always hide User Management for Staff
      const navUsers = document.getElementById('nav-users');
      if (navUsers) navUsers.style.display = 'none';

      updateSidebarUser(user);
      return;
    }

    // Unknown role — hide nothing but remove User Management
    const navUsers = document.getElementById('nav-users');
    if (navUsers) navUsers.style.display = 'none';
    updateSidebarUser();
  };

  function showAll() {
    // Make all nav items visible (undo any previous hiding)
    const allIds = [...Object.values(MODULE_NAV_MAP), ...GROUPS.map(g => g[0]), 'nav-users'];
    allIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = '';
    });
  }

  function updateSidebarUser(user) {
    const nameEl = document.querySelector('.sidebar-user .user-name');
    if (!nameEl) return;
    if (user) {
      nameEl.textContent = user.name;
    } else {
      // Fall back to role label
      const role = localStorage.getItem('role') || '';
      if (role === 'Admin') nameEl.textContent = 'Administrator';
    }
  }

  function _loadUsers() {
    try { return JSON.parse(localStorage.getItem('users_v1') || '[]'); }
    catch (e) { return []; }
  }

})();
