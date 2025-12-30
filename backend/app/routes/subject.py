from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.subject import SubjectCreate, SubjectResponse
from app.models.subject import Subject
from app.services.deps import get_db

router = APIRouter(
    prefix="/subjects",
    tags=["Subjects"]
)

@router.post("/", response_model=SubjectResponse)
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    new_subject = Subject(name=subject.name)
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return new_subject

@router.get("/", response_model=list[SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()
