from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.topic import TopicCreate, TopicResponse
from app.models.topic import Topic
from app.services.deps import get_db

router = APIRouter(
    prefix="/topics",
    tags=["Topics"]
)

@router.post("/", response_model=TopicResponse)
def create_topic(topic: TopicCreate, db: Session = Depends(get_db)):
    new_topic = Topic(
        name=topic.name,
        estimated_hours=topic.estimated_hours,
        subject_id=topic.subject_id
    )
    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)
    return new_topic

@router.get("/subject/{subject_id}", response_model=list[TopicResponse])
def get_topics_by_subject(subject_id: int, db: Session = Depends(get_db)):
    return db.query(Topic).filter(Topic.subject_id == subject_id).all()
