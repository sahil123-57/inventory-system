from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
import sqlite3

app = FastAPI(title="Inventory & Order Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use SQLite local fallback for development, easily swapped to PostgreSQL via env vars
DB_FILE = "inventory.db"

def get_db_conn():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_conn()
    cursor = conn.cursor()
    # 1. Products Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            sku TEXT NOT NULL UNIQUE,
            description TEXT
        )
    """)
    # 2. Customers Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
        )
    """)
    # 3. Orders Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)
    
    # Seed data if empty
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO products (name, category, quantity, price, sku, description) VALUES ('Wireless Mouse', 'Electronics', 45, 29.99, 'ELEC-MSE-01', 'Ergonomic mouse')")
        cursor.execute("INSERT INTO products (name, category, quantity, price, sku, description) VALUES ('Mechanical Keyboard', 'Electronics', 12, 89.99, 'ELEC-KBD-02', 'RGB keyboard')")
        cursor.execute("INSERT INTO customers (name, email) VALUES ('John Doe', 'john@example.com')")
        conn.commit()
    conn.close()

init_db()

# Schemas
class ProductSchema(BaseModel):
    id: Optional[int] = None
    name: str
    category: str
    quantity: int
    price: float
    sku: str
    description: Optional[str] = None

class CustomerSchema(BaseModel):
    id: Optional[int] = None
    name: str
    email: str

class OrderCreateSchema(BaseModel):
    customer_id: int
    product_id: int
    quantity: int

class OrderResponseSchema(BaseModel):
    id: int
    customer_id: int
    product_id: int
    quantity: int
    status: str

@app.get("/items", response_model=List[ProductSchema])
def get_products():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/items", response_model=ProductSchema, status_code=201)
def create_product(product: ProductSchema):
    conn = get_db_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO products (name, category, quantity, price, sku, description) VALUES (?, ?, ?, ?, ?, ?)",
            (product.name, product.category, product.quantity, product.price, product.sku, product.description)
        )
        conn.commit()
        product.id = cursor.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Product SKU already exists")
    conn.close()
    return product

@app.post("/orders", response_model=OrderResponseSchema, status_code=201)
def place_order(order: OrderCreateSchema):
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # Check Product Stock
    cursor.execute("SELECT quantity FROM products WHERE id = ?", (order.product_id,))
    product = cursor.fetchone()
    if not product:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    
    current_stock = product['quantity']
    if current_stock < order.quantity:
        conn.close()
        raise HTTPException(status_code=400, detail="Insufficient product stock to fulfill order")
    
    # Atomic Deduct Stock and Create Order
    new_stock = current_stock - order.quantity
    cursor.execute("UPDATE products SET quantity = ? WHERE id = ?", (new_stock, order.product_id))
    
    cursor.execute(
        "INSERT INTO orders (customer_id, product_id, quantity, status) VALUES (?, ?, ?, 'Processed')",
        (order.customer_id, order.product_id, order.quantity)
    )
    conn.commit()
    order_id = cursor.lastrowid
    conn.close()
    
    return OrderResponseSchema(id=order_id, customer_id=order.customer_id, product_id=order.product_id, quantity=order.quantity, status="Processed")