from pydantic import BaseModel, EmailStr
from typing import List
from sqlalchemy import Column, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class RegisterUser(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str

class LoginUser(BaseModel):
    email: EmailStr
    password: str

class ScenarioStep(BaseModel):
    name: str
    method: str
    url: str
    enabled: bool = True
class AssertionSchema(BaseModel):
    status_code: int
    max_response_time: int
    max_error_rate: float

class TestCreate(BaseModel):

    test_name: str

    users: int

    duration: int

    ramp_up: int

    loop_count: int

    scenario: List[ScenarioStep]
    
    assertions: AssertionSchema
    
    

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)

    execution_id = Column(
        Integer,
        ForeignKey("test_runs.id")
    )

    avg_response_time = Column(Float, default=0)

    requests_per_second = Column(Float, default=0)

    error_rate = Column(Float, default=0)

    passed_checks = Column(Float, default=0)

    total_requests = Column(Integer, default=0)

    failed_requests = Column(Integer, default=0)

    output = Column(Text)
    
    
