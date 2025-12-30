from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.services.database import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    estimated_hours = Column(Integer)
    is_completed = Column(Boolean, default=False)

    subject_id = Column(Integer, ForeignKey("subjects.id"))

    subject = relationship("Subject", backref="topics")
