import * as api from './api.js';
import * as utils from './utils.js';
import * as ui from './ui.js';

let state = {
    tasks: [],
    settings: {},
    sortMethod: 'days_left',
    sortAscending: true,
    initialSettingsStr: ""
};

const callbacks = {
    onUpdate: async (id, payload) => {
        try {
            const updated = await api.updateTask(id, payload);
            state.tasks = state.tasks.map(t => t.id === id ? updated : t);
            refreshUI();
        } catch(e) {
            console.error(e);
        }
    }
};

function refreshUI() {
    const categorized = utils.categorizeAndSortTasks(state.tasks, state.settings, state.sortMethod, state.sortAscending);
    ui.renderTasksWithAnimation(categorized, callbacks);
}

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const btnSync = document.getElementById('btn-sync');
    const btnSettings = document.getElementById('btn-settings');
    const btnTrash = document.getElementById('btn-trash');
    const btnDashboard = document.getElementById('btn-dashboard');
    const activeTasksSection = document.getElementById('active-tasks-section');
    const sectionUploaded = document.getElementById('uploaded-tasks-section');
    const sectionSkipped = document.getElementById('skipped-tasks-section');
    const archivedTasksSection = document.getElementById('archived-tasks-section');
    const trashTasksSection = document.getElementById('trash-tasks-section');
    const toggleArchive = document.getElementById('toggle-archive');
    const btnClearArchive = document.getElementById('btn-clear-archive');
    const activeSortControls = document.getElementById('active-sort-controls');
    
    const sortSelect = document.getElementById('sort-select');
    const btnSortDir = document.getElementById('btn-sort-dir');
    const btnRefreshSort = document.getElementById('btn-refresh-sort');
    
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnCancelSettings = document.getElementById('btn-cancel-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    if (activeSortControls) {
        activeSortControls.addEventListener('click', (e) => e.stopPropagation());
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            state.sortMethod = e.target.value;
            refreshUI();
        });
    }

    if (btnSortDir) {
        btnSortDir.addEventListener('click', () => {
            state.sortAscending = !state.sortAscending;
            btnSortDir.querySelector('svg').style.transform = state.sortAscending ? '' : 'rotate(180deg)';
            btnSortDir.querySelector('svg').style.transition = 'transform 0.3s ease';
            refreshUI();
        });
    }

    if (btnRefreshSort) {
        btnRefreshSort.addEventListener('click', refreshUI);
    }

    // Settings logic
    function checkSettingsChanged() {
        const delayRaw = parseInt(document.getElementById('archive-delay').value) || 0;
        const delay = Math.max(0, delayRaw);
        if (delayRaw !== delay) document.getElementById('archive-delay').value = delay;
        
        const theme = document.getElementById('theme-select').value;
        const mode = document.getElementById('filter-mode').value;
        const rule = document.getElementById('filter-match-rule').value;
        const subjectsStr = document.getElementById('subjects-list').value;
        const subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s);
        const taskNamesStr = document.getElementById('task-names-list').value;
        const taskNames = taskNamesStr.split(',').map(s => s.trim()).filter(s => s);
        
        const current = JSON.stringify({ delay, theme, mode, rule, subjects, taskNames });
        if (current === state.initialSettingsStr) {
            btnSaveSettings.disabled = true;
            btnSaveSettings.style.opacity = '0.5';
        } else {
            btnSaveSettings.disabled = false;
            btnSaveSettings.style.opacity = '1';
        }
    }

    function populateSettingsForm() {
        document.getElementById('archive-delay').value = state.settings.archive_delay_days || 0;
        document.getElementById('theme-select').value = state.settings.theme || 'dark';
        document.getElementById('filter-mode').value = state.settings.filter_mode || 'whitelist';
        document.getElementById('filter-match-rule').value = state.settings.filter_match_rule || 'exact';
        document.getElementById('subjects-list').value = state.settings.subjects ? state.settings.subjects.join(', ') : '';
        document.getElementById('task-names-list').value = state.settings.task_names ? state.settings.task_names.join(', ') : '';
        
        const delay = state.settings.archive_delay_days || 0;
        const theme = state.settings.theme || 'dark';
        const mode = state.settings.filter_mode || 'whitelist';
        const rule = state.settings.filter_match_rule || 'exact';
        const subjects = state.settings.subjects || [];
        const taskNames = state.settings.task_names || [];
        state.initialSettingsStr = JSON.stringify({ delay, theme, mode, rule, subjects, taskNames });
        checkSettingsChanged();
    }

    function openSettings() {
        populateSettingsForm();
        settingsModal.classList.remove('hidden');
    }
    
    function closeSettings() {
        settingsModal.classList.add('hidden');
    }

    btnSettings.addEventListener('click', openSettings);
    btnCloseSettings.addEventListener('click', closeSettings);
    btnCancelSettings.addEventListener('click', closeSettings);

    btnSaveSettings.addEventListener('click', async () => {
        const delay = parseInt(document.getElementById('archive-delay').value) || 0;
        const theme = document.getElementById('theme-select').value;
        const mode = document.getElementById('filter-mode').value;
        const rule = document.getElementById('filter-match-rule').value;
        const subjectsStr = document.getElementById('subjects-list').value;
        const subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s);
        const taskNamesStr = document.getElementById('task-names-list').value;
        const taskNames = taskNamesStr.split(',').map(s => s.trim()).filter(s => s);
        
        try {
            state.settings = await api.saveSettings({
                theme: theme,
                archive_delay_days: delay,
                filter_mode: mode,
                filter_match_rule: rule,
                subjects: subjects,
                task_names: taskNames
            });
            document.documentElement.dataset.theme = state.settings.theme || 'dark';
            closeSettings();
            refreshUI();
        } catch(e) {
            alert('Error saving settings');
        }
    });

    ['archive-delay', 'theme-select', 'filter-mode', 'filter-match-rule', 'subjects-list', 'task-names-list'].forEach(id => {
        document.getElementById(id).addEventListener('input', checkSettingsChanged);
        document.getElementById(id).addEventListener('change', checkSettingsChanged);
    });

    // Actions
    btnSync.addEventListener('click', async () => {
        btnSync.innerHTML = '<span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg></span> Syncing...';
        btnSync.disabled = true;
        try {
            state.tasks = await api.syncTasks();
            refreshUI();
        } catch (e) {
            alert(e.message || 'Error syncing tasks');
        } finally {
            btnSync.innerHTML = '<span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg></span> Sync';
            btnSync.disabled = false;
        }
    });

    btnTrash.addEventListener('click', () => {
        activeTasksSection.classList.add('hidden');
        if (sectionUploaded) sectionUploaded.classList.add('hidden');
        if (sectionSkipped) sectionSkipped.classList.add('hidden');
        archivedTasksSection.classList.add('hidden');
        trashTasksSection.classList.remove('hidden');
        btnTrash.classList.add('hidden');
        btnDashboard.classList.remove('hidden');
    });
    
    btnDashboard.addEventListener('click', () => {
        activeTasksSection.classList.remove('hidden');
        if (sectionUploaded) sectionUploaded.classList.remove('hidden');
        if (sectionSkipped) sectionSkipped.classList.remove('hidden');
        archivedTasksSection.classList.remove('hidden');
        trashTasksSection.classList.add('hidden');
        btnTrash.classList.remove('hidden');
        btnDashboard.classList.add('hidden');
    });

    toggleArchive.addEventListener('click', (e) => {
        if (e.target === btnClearArchive) return;
        const archivedTasksList = document.getElementById('archived-tasks-list');
        archivedTasksList.classList.toggle('hidden');
        toggleArchive.querySelector('.toggle-icon').classList.toggle('open');
    });

    const toggleActive = document.getElementById('toggle-active');
    if (toggleActive) {
        toggleActive.addEventListener('click', (e) => {
            document.getElementById('active-tasks-list').classList.toggle('hidden');
            toggleActive.querySelector('.toggle-icon').classList.toggle('open');
        });
    }

    const toggleUploaded = document.getElementById('toggle-uploaded');
    if (toggleUploaded) {
        toggleUploaded.addEventListener('click', (e) => {
            document.getElementById('active-tasks-uploaded').classList.toggle('hidden');
            toggleUploaded.querySelector('.toggle-icon').classList.toggle('open');
        });
    }

    const toggleSkipped = document.getElementById('toggle-skipped');
    if (toggleSkipped) {
        toggleSkipped.addEventListener('click', (e) => {
            document.getElementById('active-tasks-skipped').classList.toggle('hidden');
            toggleSkipped.querySelector('.toggle-icon').classList.toggle('open');
        });
    }

    btnClearArchive.addEventListener('click', async () => {
        try {
            await api.clearArchive();
            state.tasks = await api.fetchTasks();
            refreshUI();
        } catch(e) {
            console.error(e);
        }
    });

    const btnEmptyTrash = document.getElementById('btn-empty-trash');
    if (btnEmptyTrash) {
        btnEmptyTrash.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to permanently delete all items in the trash?')) return;
            try {
                await api.emptyTrash();
                state.tasks = await api.fetchTasks();
                refreshUI();
            } catch(e) {
                console.error(e);
            }
        });
    }

    // Initial load
    async function init() {
        try {
            state.settings = await api.fetchSettings();
            document.documentElement.dataset.theme = state.settings.theme || 'dark';
            state.tasks = await api.fetchTasks();
            
            let sortSelectElement = document.getElementById('sort-select');
            state.sortMethod = sortSelectElement ? sortSelectElement.value : 'days_left';
            
            refreshUI();
        } catch(e) {
            console.error("Failed to initialize app", e);
        }
    }

    init();
});
