from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3

app = FastAPI(title="Inventory Management API")

# Enable CORS for React frontend communications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "inventory.db"

# Initialize Database Table and seed it with starter data if empty
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            sku TEXT NOT NULL UNIQUE,
            description TEXT
        )
    """)
    
    # Seed starter data if table is completely empty
    cursor.execute("SELECT COUNT(*) FROM inventory")
    if cursor.fetchone()[0] == 0:
        starter_items = [
            (1, "Wireless Mouse", "Electronics", 45, 29.99, "ELEC-MSE-01", "Ergonomic 2.4GHz wireless mouse"),
            (2, "Mechanical Keyboard", "Electronics", 12, 89.99, "ELEC-KBD-02", "RGB backlit tactile keyboard"),
            (3, "Office Chair", "Furniture", 8, 149.50, "FURN-CHR-03", "High-back mesh office chair with lumbar support")
        ]
        cursor.executemany("INSERT INTO inventory VALUES (?, ?, ?, ?, ?, ?, ?)", starter_items)
        conn.commit()
    conn.close()

init_db()

# Pydantic schema layout for incoming/outgoing data validation
class InventoryItem(BaseModel):
    id: int
    name: str
    category: str
    quantity: int
    price: float
    sku: str
    description: Optional[str] = None

@app.get("/")
def root():
    return {"status": "online", "database": "sqlite connected"}

# 1. GET ALL ITEMS FROM SQL DATABASE
@app.get("/items", response_model=List[InventoryItem])
def get_all_items():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inventory")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# 2. GET SINGLE ITEM BY ID
@app.get("/items/{item_id}", response_model=InventoryItem)
def get_item(item_id: int):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inventory WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return dict(row)

# 3. CREATE A NEW ITEM IN SQL
@app.post("/items", response_model=InventoryItem, status_code=201)
def create_item(item: InventoryItem):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO inventory (id, name, category, quantity, price, sku, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (item.id, item.name, item.category, item.quantity, item.price, item.sku, item.description)
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.close()
        raise HTTPException(status_code=400, detail="Asset ID or SKU already exists in records")
    conn.close()
    return item

# 4. UPDATE AN EXISTING ITEM
@app.put("/items/{item_id}", response_model=InventoryItem)
def update_item(item_id: int, updated_item: InventoryItem):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM inventory WHERE id = ?", (item_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")
    
    cursor.execute("""
        UPDATE inventory 
        SET name = ?, category = ?, quantity = ?, price = ?, sku = ?, description = ?
        WHERE id = ?
    """, (updated_item.name, updated_item.category, updated_item.quantity, updated_item.price, updated_item.sku, updated_item.description, item_id))
    conn.commit()
    conn.close()
    return updated_item

# 5. DELETE AN ITEM FROM DATABASE
@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM inventory WHERE id = ?", (item_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")
    
    cursor.execute("DELETE FROM inventory WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"message": f"Successfully deleted item {item_id}"}