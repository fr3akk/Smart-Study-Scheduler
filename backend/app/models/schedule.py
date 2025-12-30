from sqlalchemy import Column, Integer, String, Date
from app.services.database import Base

class StudySchedule(Base):
    __tablename__ = "study_schedule"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    topic = Column(String, nullable=False)
    hours = Column(Integer, nullable=False)
