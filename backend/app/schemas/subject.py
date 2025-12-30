from pydantic import BaseModel

class SubjectCreate(BaseModel):
    name: str

class SubjectResponse(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True
