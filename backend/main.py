from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Inventory Management API")

# Enable CORS so your React frontend can talk to this backend smoothly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define what an Inventory Item looks like using Pydantic
class InventoryItem(BaseModel):
    id: int
    name: str
    category: str
    quantity: int
    price: float
    sku: str
    description: Optional[str] = None

# Temporary local in-memory database storage populated with initial dummy items
inventory_db: List[InventoryItem] = [
    InventoryItem(id=1, name="Wireless Mouse", category="Electronics", quantity=45, price=29.99, sku="ELEC-MSE-01", description="Ergonomic 2.4GHz wireless mouse"),
    InventoryItem(id=2, name="Mechanical Keyboard", category="Electronics", quantity=12, price=89.99, sku="ELEC-KBD-02", description="RGB backlit tactile keyboard"),
    InventoryItem(id=3, name="Office Chair", category="Furniture", quantity=8, price=149.50, sku="FURN-CHR-03", description="High-back mesh office chair with lumbar support")
]

@app.get("/")
def root():
    return {"status": "online", "message": "Inventory Backend API Operational"}

# 1. GET ALL ITEMS
@app.get("/items", response_model=List[InventoryItem])
def get_all_items():
    return inventory_db

# 2. GET SINGLE ITEM BY ID
@app.get("/items/{item_id}", response_model=InventoryItem)
def get_item(item_id: int):
    for item in inventory_db:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found in inventory")

# 3. CREATE A NEW ITEM
@app.post("/items", response_model=InventoryItem, status_code=201)
def create_item(item: InventoryItem):
    # Check if ID already exists
    for existing_item in inventory_db:
        if existing_item.id == item.id:
            raise HTTPException(status_code=400, detail="Item with this ID already exists")
    inventory_db.append(item)
    return item

# 4. UPDATE AN EXISTING ITEM
@app.put("/items/{item_id}", response_model=InventoryItem)
def update_item(item_id: int, updated_item: InventoryItem):
    for index, item in enumerate(inventory_db):
        if item.id == item_id:
            inventory_db[index] = updated_item
            return updated_item
    raise HTTPException(status_code=404, detail="Item not found")

# 5. DELETE AN ITEM
@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    for index, item in enumerate(inventory_db):
        if item.id == item_id:
            inventory_db.pop(index)
            return {"message": f"Successfully deleted item {item_id}"}
    raise HTTPException(status_code=404, detail="Item not found")