from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from database import get_db
import models
import schemas

router = APIRouter()

def get_or_create_settings(db: Session) -> models.SettingsModel:
    settings = db.query(models.SettingsModel).first()
    if not settings:
        settings = models.SettingsModel()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("/api/settings", response_model=schemas.Settings)
def read_settings(db: Session = Depends(get_db)):
    db_settings = get_or_create_settings(db)
    return schemas.Settings(
        theme=db_settings.theme,
        archive_delay_days=db_settings.archive_delay_days,
        filter_mode=db_settings.filter_mode,
        filter_match_rule=db_settings.filter_match_rule,
        subjects=json.loads(db_settings.subjects_json),
        task_names=json.loads(db_settings.task_names_json)
    )

@router.patch("/api/settings", response_model=schemas.Settings)
def update_settings(settings: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    db_settings = get_or_create_settings(db)
    if settings.theme is not None:
        db_settings.theme = settings.theme
    if settings.archive_delay_days is not None:
        db_settings.archive_delay_days = settings.archive_delay_days
    if settings.filter_mode is not None:
        db_settings.filter_mode = settings.filter_mode
    if settings.filter_match_rule is not None:
        db_settings.filter_match_rule = settings.filter_match_rule
    if settings.subjects is not None:
        db_settings.subjects_json = json.dumps(settings.subjects)
    if settings.task_names is not None:
        db_settings.task_names_json = json.dumps(settings.task_names)
    
    db.commit()
    db.refresh(db_settings)
    return read_settings(db=db)
