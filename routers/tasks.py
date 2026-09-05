from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import datetime

from database import get_db
import models
import schemas
from routers.settings import get_or_create_settings
from services.lms_client import get_file_cookies, fetch_lms_tasks

router = APIRouter()

@router.get("/api/tasks", response_model=List[schemas.Task])
def read_tasks(db: Session = Depends(get_db)):
    tasks = db.query(models.TaskModel).all()
    return tasks

@router.post("/api/tasks/sync")
async def sync_tasks(request: Request, db: Session = Depends(get_db)):
    cookie_str = get_file_cookies()
    
    if not cookie_str:
        raise HTTPException(status_code=401, detail="No cookies found in cookies.json.")
    # Fetch tasks
    lms_tasks = await fetch_lms_tasks(cookie_str)
    
    synced_task_ids = set()
    
    for lms_task in lms_tasks:
        subject = lms_task.get("course", {}).get("name")
        if not subject:
            subject = lms_task.get("subject", {}).get("name", "Unknown")
            if isinstance(subject, dict):
                subject = subject.get("name", "Unknown")
                
        task_id = str(lms_task.get("id"))
        synced_task_ids.add(task_id)
        theme = lms_task.get("theme") or {}
        theme_name = theme.get("name") if isinstance(theme, dict) else None
        
        longread = lms_task.get("longread") or {}
        longread_name = longread.get("name") if isinstance(longread, dict) else None
        
        exercise = lms_task.get("exercise") or {}
        exercise_name = exercise.get("name") if isinstance(exercise, dict) else None
        
        title = theme_name or longread_name or exercise_name or "Untitled"
        deadline_str = lms_task.get("deadline")
        
        deadline = None
        if deadline_str:
            try:
                # Handle ISO 8601 parsing
                if deadline_str.endswith('Z'):
                    deadline_str = deadline_str[:-1] + '+00:00'
                deadline = datetime.datetime.fromisoformat(deadline_str).replace(tzinfo=None)
            except Exception:
                deadline = datetime.datetime.utcnow()
        else:
            deadline = datetime.datetime.utcnow()
            
        ld_applied = lms_task.get("lateDays")
        if ld_applied is None:
            ld_applied = 0
            
        db_task = db.query(models.TaskModel).filter(models.TaskModel.id == task_id).first()
        if db_task:
            db_task.title = title
            db_task.subject = subject
            db_task.deadline = deadline
            db_task.ld_applied = ld_applied
        else:
            # Create new task
            db_task = models.TaskModel(
                id=task_id,
                title=title,
                subject=subject,
                deadline=deadline,
                ld_applied=ld_applied
            )
            db.add(db_task)
        
    # Mark tasks as completed if they are missing from the LMS response
    active_db_tasks = db.query(models.TaskModel).filter(
        models.TaskModel.is_deleted == False,
        models.TaskModel.is_completed == False
    ).all()
    
    for db_task in active_db_tasks:
        if db_task.id not in synced_task_ids:
            db_task.is_completed = True
            db_task.completed_items = db_task.total_items
            
    db.commit()
    
    # Return all active tasks
    return read_tasks(db=db)

@router.patch("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: str, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.TaskModel).filter(models.TaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task_update.completed_items is not None:
        db_task.completed_items = task_update.completed_items
        if db_task.completed_items == db_task.total_items:
            db_task.is_completed = True
        else:
            db_task.is_completed = False
            
    if task_update.total_items is not None:
        db_task.total_items = max(1, task_update.total_items)
        if db_task.completed_items == db_task.total_items:
            db_task.is_completed = True
        else:
            db_task.is_completed = False
            
    if task_update.is_skipped is not None:
        db_task.is_skipped = task_update.is_skipped
        
    if task_update.is_deleted is not None:
        db_task.is_deleted = task_update.is_deleted
        
    if task_update.is_completed is not None:
        db_task.is_completed = task_update.is_completed
        if db_task.is_completed:
            db_task.completed_items = db_task.total_items
            
    if task_update.is_uploaded is not None:
        db_task.is_uploaded = task_update.is_uploaded
            
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/api/tasks/archive")
def clear_archive(db: Session = Depends(get_db)):
    # Calculate cutoff date
    db_settings = get_or_create_settings(db)
    delay_days = db_settings.archive_delay_days
    
    cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=delay_days)
    
    # Delete tasks where deadline is older than cutoff
    tasks_to_delete = db.query(models.TaskModel).filter(models.TaskModel.deadline < cutoff_date).all()
    
    count = 0
    for task in tasks_to_delete:
        task.is_deleted = True
        count += 1
        
    db.commit()
    return {"status": "success", "deleted_count": count}

@router.delete("/api/tasks/trash")
def empty_trash(db: Session = Depends(get_db)):
    db.query(models.TaskModel).filter(models.TaskModel.is_deleted == True).delete()
    db.commit()
    return {"status": "ok"}
