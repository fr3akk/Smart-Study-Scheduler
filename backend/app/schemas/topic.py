from pydantic import BaseModel

class TopicCreate(BaseModel):
    name: str
    estimated_hours: int
    subject_id: int

class TopicResponse(BaseModel):
    id: int
    name: str
    estimated_hours: int
    is_completed: bool
    subject_id: int

    class Config:
        orm_mode = True
