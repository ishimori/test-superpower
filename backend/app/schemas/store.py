from pydantic import BaseModel


class StoreResponse(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}
