export async function fetchSettings() {
    const res = await fetch('/api/settings');
    return await res.json();
}

export async function fetchTasks() {
    const res = await fetch('/api/tasks');
    return await res.json();
}

export async function syncTasks() {
    const res = await fetch('/api/tasks/sync', { method: 'POST' });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to sync');
    }
    return await res.json();
}

export async function updateTask(id, payload) {
    const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return await res.json();
}

export async function clearArchive() {
    const res = await fetch('/api/tasks/archive', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear archive');
}

export async function emptyTrash() {
    const res = await fetch('/api/tasks/trash', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to empty trash');
}

export async function saveSettings(payload) {
    const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return await res.json();
}
