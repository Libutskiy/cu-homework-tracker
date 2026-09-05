export function createTaskCard(task, callbacks, isArchived = false, isTrash = false, isReplacement = false) {
    const card = document.createElement('div');
    card.className = 'task-card glass';
    card.dataset.taskId = task.id;
    if (isReplacement) card.style.animation = 'none';
    
    const pct = task.total_items > 0 ? (task.completed_items / task.total_items) * 100 : 0;
    card.style.setProperty('--progress-color', `hsl(${pct * 1.2}, 70%, 50%)`);
    
    const now = new Date();
    const deadlineDate = new Date(task.deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let countdownClass = 'safe';
    let countdownText = `${diffDays} days left`;
    
    if (diffDays < 0) {
        countdownClass = 'urgent';
        countdownText = `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays <= 2) {
        countdownClass = 'urgent';
    } else if (diffDays <= 5) {
        countdownClass = 'warning';
    }
    
    let actionsHtml = '';
    if (isTrash) {
        actionsHtml = `<button class="btn-icon btn-restore" title="Restore"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg></button>`;
    } else {
        let completeActionHtml = task.is_completed 
            ? `<button class="btn-icon btn-reset" title="Reset"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg></button>`
            : `<button class="btn-icon btn-complete" title="Complete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></button>`;
        let skipActionHtml = task.is_skipped
            ? `<button class="btn-icon btn-skip" title="Unskip"><svg style="transform: rotate(180deg);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg></button>`
            : `<button class="btn-icon btn-skip" title="Skip"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg></button>`;
        let uploadActionHtml = `<button class="btn-icon btn-upload ${task.is_uploaded ? 'uploaded' : ''}" title="${task.is_uploaded ? 'Unupload' : 'Upload'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></button>`;
        actionsHtml = `
                ${completeActionHtml}
                ${skipActionHtml}
                <button class="btn-icon btn-delete" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                ${uploadActionHtml}
        `;
    }
    
    card.innerHTML = `
        <div class="task-info">
            <h3>${task.title}</h3>
            <div class="task-subject">${task.subject}</div>
            
            <div class="progress-container">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${pct}%"></div>
                </div>
                <div class="progress-inputs">
                    <input type="number" class="inp-completed" value="${task.completed_items}" min="0">
                    <span>/</span>
                    <input type="number" class="inp-total" value="${task.total_items}" min="1">
                </div>
            </div>
        </div>
        
        <div class="task-meta">
            <div class="countdown ${countdownClass}">${countdownText}</div>
            <div class="deadline-date">${deadlineDate.toLocaleDateString()} ${deadlineDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            ${task.ld_applied > 0 ? `<div class="ld-badge">${task.ld_applied} LD</div>` : ''}
            
            <div class="task-actions">
                ${actionsHtml}
            </div>
        </div>
    `;
    
    const inpCompleted = card.querySelector('.inp-completed');
    const inpTotal = card.querySelector('.inp-total');
    
    const updateProgress = () => {
        const c = Math.max(0, parseInt(inpCompleted.value) || 0);
        const t = Math.max(1, parseInt(inpTotal.value) || 1);
        inpCompleted.value = c;
        inpTotal.value = t;
        
        const pct = t > 0 ? (c / t) * 100 : 0;
        card.querySelector('.progress-bar-fill').style.width = `${pct}%`;
        card.style.setProperty('--progress-color', `hsl(${pct * 1.2}, 70%, 50%)`);
        
        callbacks.onUpdate(task.id, { completed_items: c, total_items: t });
    };
    
    inpCompleted.addEventListener('change', updateProgress);
    inpTotal.addEventListener('change', updateProgress);
    
    if (isTrash) {
        card.querySelector('.btn-restore').addEventListener('click', async () => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            await new Promise(r => setTimeout(r, 300));
            callbacks.onUpdate(task.id, { is_deleted: false });
        });
    } else {
        const btnComplete = card.querySelector('.btn-complete');
        if (btnComplete) {
            btnComplete.addEventListener('click', () => {
                callbacks.onUpdate(task.id, { is_completed: true });
            });
        }
        const btnReset = card.querySelector('.btn-reset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                callbacks.onUpdate(task.id, { is_completed: false, completed_items: 0 });
            });
        }
        card.querySelector('.btn-skip').addEventListener('click', () => {
            callbacks.onUpdate(task.id, { is_skipped: !task.is_skipped });
        });
        card.querySelector('.btn-delete').addEventListener('click', async () => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            await new Promise(r => setTimeout(r, 300));
            callbacks.onUpdate(task.id, { is_deleted: true });
        });
        card.querySelector('.btn-upload').addEventListener('click', () => {
            callbacks.onUpdate(task.id, { is_uploaded: !task.is_uploaded });
        });
    }
    
    return card;
}

export function renderTasksWithAnimation(categorizedTasks, callbacks) {
    const oldPositions = new Map();
    document.querySelectorAll('.task-card').forEach(card => {
        if (card.dataset.taskId) {
            oldPositions.set(card.dataset.taskId, card.getBoundingClientRect());
        }
    });
    
    renderTasksCore(categorizedTasks, callbacks, oldPositions);
    
    requestAnimationFrame(() => {
        document.querySelectorAll('.task-card').forEach(card => {
            const id = card.dataset.taskId;
            if (id && oldPositions.has(id)) {
                const oldRect = oldPositions.get(id);
                const newRect = card.getBoundingClientRect();
                
                const deltaX = oldRect.left - newRect.left;
                const deltaY = oldRect.top - newRect.top;
                
                if (deltaX !== 0 || deltaY !== 0) {
                    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                    card.style.transition = 'none';
                    
                    requestAnimationFrame(() => {
                        card.style.transform = '';
                        card.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    });
                }
            }
        });
    });
}

function renderTasksCore({ active_normal, active_uploaded, active_skipped, archived, trash }, callbacks, oldPositions = null) {
    const el = (id) => document.getElementById(id);
    const activeTasksNormal = el('active-tasks-normal');
    const activeTasksUploaded = el('active-tasks-uploaded');
    const activeTasksSkipped = el('active-tasks-skipped');
    const archivedTasksList = el('archived-tasks-list');
    const trashTasksList = el('trash-tasks-list');
    
    if (activeTasksNormal) activeTasksNormal.innerHTML = '';
    if (activeTasksUploaded) activeTasksUploaded.innerHTML = '';
    if (activeTasksSkipped) activeTasksSkipped.innerHTML = '';
    archivedTasksList.innerHTML = '';
    trashTasksList.innerHTML = '';
    
    if (el('active-count')) el('active-count').textContent = active_normal.length;
    if (el('uploaded-count')) el('uploaded-count').textContent = active_uploaded.length;
    if (el('skipped-count')) el('skipped-count').textContent = active_skipped.length;
    if (el('archive-count')) el('archive-count').textContent = archived.length;
    if (el('trash-count')) el('trash-count').textContent = trash.length;
    
    const renderList = (container, items, emptyText, isArchived = false, isTrash = false) => {
        if (!container) return;
        if (items.length === 0) {
            container.innerHTML = `<div class="empty-message">${emptyText}</div>`;
        } else {
            items.forEach(t => {
                const isReplacement = oldPositions ? oldPositions.has(t.id.toString()) : false;
                container.appendChild(createTaskCard(t, callbacks, isArchived, isTrash, isReplacement));
            });
        }
    };

    renderList(activeTasksNormal, active_normal, "No active tasks right now.");
    renderList(activeTasksUploaded, active_uploaded, "No uploaded tasks.");
    renderList(activeTasksSkipped, active_skipped, "No skipped tasks.");
    renderList(archivedTasksList, archived, "Archive is empty.", true, false);
    renderList(trashTasksList, trash, "Trash bin is empty.", false, true);
}
