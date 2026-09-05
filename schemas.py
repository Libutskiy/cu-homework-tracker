from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class TaskBase(BaseModel):
    id: str
    title: str
    subject: str
    deadline: datetime
    ld_applied: int = 0
    
class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    completed_items: Optional[int] = None
    total_items: Optional[int] = None
    is_skipped: Optional[bool] = None
    is_deleted: Optional[bool] = None
    is_completed: Optional[bool] = None
    is_uploaded: Optional[bool] = None

class Task(TaskBase):
    completed_items: int
    total_items: int
    is_skipped: bool
    is_deleted: bool
    is_completed: bool
    is_uploaded: bool

    class Config:
        from_attributes = True

class SettingsBase(BaseModel):
    theme: str = "dark"
    archive_delay_days: int = 0
    filter_mode: str = "whitelist"
    filter_match_rule: str = "exact"
    subjects: List[str] = []
    task_names: List[str] = []

class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    archive_delay_days: Optional[int] = None
    filter_mode: Optional[str] = None
    filter_match_rule: Optional[str] = None
    subjects: Optional[List[str]] = None
    task_names: Optional[List[str]] = None

class Settings(SettingsBase):
    class Config:
        from_attributes = True
