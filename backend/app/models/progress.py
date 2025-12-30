from sqlalchemy import Column, Integer, String, Boolean, Date
from app.services.database import Base

class StudyProgress(Base):
    __tablename__ = "study_progress"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    topic = Column(String, nullable=False)
    hours = Column(Integer, nullable=False)
    completed = Column(Boolean, default=False)
