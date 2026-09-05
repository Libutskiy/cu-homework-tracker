export function categorizeAndSortTasks(tasks, settings, sortMethod, sortAscending) {
    let active = [];
    let archived = [];
    let trash = [];
    
    const now = new Date();
    const delayDays = settings.archive_delay_days || 0;
    
    tasks.forEach(task => {
        const subject = task.subject || "";
        const title = task.title || "";
        
        let matchSubject = false;
        if (settings.subjects && settings.subjects.length > 0) {
            for (const s of settings.subjects) {
                if (settings.filter_match_rule === 'exact' && s.toLowerCase() === subject.toLowerCase()) matchSubject = true;
                if (settings.filter_match_rule === 'partial' && subject.toLowerCase().includes(s.toLowerCase())) matchSubject = true;
            }
        }
        
        let matchName = false;
        if (settings.task_names && settings.task_names.length > 0) {
            for (const n of settings.task_names) {
                if (settings.filter_match_rule === 'exact' && n.toLowerCase() === title.toLowerCase()) matchName = true;
                if (settings.filter_match_rule === 'partial' && title.toLowerCase().includes(n.toLowerCase())) matchName = true;
            }
        }
        
        const hasSubjects = settings.subjects && settings.subjects.length > 0;
        const hasNames = settings.task_names && settings.task_names.length > 0;
        
        let isMatch = false;
        if (hasSubjects && matchSubject) isMatch = true;
        if (hasNames && matchName) isMatch = true;
        
        if (hasSubjects || hasNames) {
            if (settings.filter_mode === 'whitelist' && !isMatch) return;
            if (settings.filter_mode === 'blacklist' && isMatch) return;
        }

        if (task.is_deleted) {
            trash.push(task);
            return;
        }
        
        const deadline = new Date(task.deadline);
        const cutoffDate = new Date(deadline);
        cutoffDate.setDate(cutoffDate.getDate() + delayDays);
        
        if (now > cutoffDate) {
            archived.push(task);
        } else {
            active.push(task);
        }
    });
    
    let active_normal = [];
    let active_uploaded = [];
    let active_skipped = [];
    
    active.forEach(t => {
        if (t.is_skipped) active_skipped.push(t);
        else if (t.is_uploaded) active_uploaded.push(t);
        else active_normal.push(t);
    });

    const sortFn = (a, b) => {
        let valA, valB;
        if (sortMethod === 'progress') {
            valA = a.total_items > 0 ? (a.completed_items / a.total_items) : 0;
            valB = b.total_items > 0 ? (b.completed_items / b.total_items) : 0;
        } else {
            valA = new Date(a.deadline).getTime();
            valB = new Date(b.deadline).getTime();
        }
        if (valA === valB) {
            return (a.title || "").localeCompare(b.title || "") * (sortAscending ? 1 : -1);
        }
        return (valA < valB ? -1 : 1) * (sortAscending ? 1 : -1);
    };
    
    active_normal.sort(sortFn);
    active_uploaded.sort(sortFn);
    active_skipped.sort(sortFn);
    
    archived.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
    trash.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
    
    return { active_normal, active_uploaded, active_skipped, archived, trash };
}
