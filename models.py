from sqlalchemy import Column, String, Integer, Boolean, DateTime, Float
from database import Base
import datetime

class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    subject = Column(String, index=True)
    deadline = Column(DateTime)
    ld_applied = Column(Integer, default=0)
    weight = Column(Float, nullable=True)
    url = Column(String, nullable=True)
    
    # Local State
    completed_items = Column(Integer, default=0)
    total_items = Column(Integer, default=10)
    is_skipped = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    is_uploaded = Column(Boolean, default=False)
    
class SettingsModel(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    theme = Column(String, default="dark")
    archive_delay_days = Column(Integer, default=0)
    filter_mode = Column(String, default="whitelist") # whitelist or blacklist
    filter_match_rule = Column(String, default="exact") # exact or partial
    subjects_json = Column(String, default="[]") # JSON array of strings
    task_names_json = Column(String, default="[]") # JSON array of strings

